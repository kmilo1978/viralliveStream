/**
 * Cliente limpio para el protocolo oficial OBS WebSocket v5 (integrado en OBS Studio 28+).
 * Implementado sin dependencias ni codigo de terceros propietarios.
 */

type ObsResponsePayload = {
  op: number;
  d: Record<string, unknown>;
};

async function sha256Base64(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", bytes);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = "";
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

async function computeObsAuthSecret(
  password: string,
  salt: string,
  challenge: string,
): Promise<string> {
  const base64Secret = await sha256Base64(`${password}${salt}`);
  return sha256Base64(`${base64Secret}${challenge}`);
}

export class ObsWebSocketV5Client {
  private ws: WebSocket | null = null;
  private reqCounter = 1;
  private pending = new Map<
    string,
    { resolve: (data: Record<string, unknown>) => void; reject: (err: Error) => void }
  >();

  async connect(url: string, password = ""): Promise<{ obsVersion: string; scenes: string[] }> {
    this.disconnect();

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      const timeout = window.setTimeout(() => {
        ws.close();
        reject(
          new Error(
            "Tiempo de espera agotado conectando a OBS WebSocket. Verifica que OBS este abierto y WebSocket activado (Herramientas -> Configuracion del servidor WebSocket).",
          ),
        );
      }, 6000);

      ws.onerror = () => {
        window.clearTimeout(timeout);
        reject(
          new Error(
            "No se pudo conectar al puerto WebSocket de OBS. Asegurate de abrir OBS Studio y activar WebSocket v5 en el puerto configurado (por defecto 4455).",
          ),
        );
      };

      ws.onclose = () => {
        for (const [, waiter] of this.pending) {
          waiter.reject(new Error("Conexion cerrada con OBS WebSocket."));
        }
        this.pending.clear();
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as ObsResponsePayload;
          if (msg.op === 0) {
            const authObj = msg.d.authentication as
              | { challenge: string; salt: string }
              | undefined;
            let authentication: string | undefined;
            if (authObj) {
              if (!password) {
                window.clearTimeout(timeout);
                ws.close();
                reject(
                  new Error("OBS requiere contrasena para WebSocket. Escribela en el campo."),
                );
                return;
              }
              authentication = await computeObsAuthSecret(
                password,
                authObj.salt,
                authObj.challenge,
              );
            }
            ws.send(
              JSON.stringify({
                op: 1,
                d: {
                  rpcVersion: 1,
                  ...(authentication ? { authentication } : {}),
                },
              }),
            );
          } else if (msg.op === 2) {
            window.clearTimeout(timeout);
            resolve();
          } else if (msg.op === 7) {
            const requestId = String(msg.d.requestId ?? "");
            const waiter = this.pending.get(requestId);
            if (!waiter) return;
            this.pending.delete(requestId);
            const status = msg.d.requestStatus as
              | { result: boolean; code: number; comment?: string }
              | undefined;
            if (!status?.result) {
              waiter.reject(
                new Error(
                  `OBS rechazo la accion (${status?.code ?? "?"}): ${status?.comment ?? "error desconocido"}`,
                ),
              );
              return;
            }
            waiter.resolve((msg.d.responseData as Record<string, unknown>) ?? {});
          }
        } catch (err) {
          window.clearTimeout(timeout);
          reject(err instanceof Error ? err : new Error("Error procesando mensaje de OBS."));
        }
      };
    });

    const versionInfo = await this.call("GetVersion");
    const sceneList = await this.call("GetSceneList");
    const scenesRaw = Array.isArray(sceneList.scenes) ? sceneList.scenes : [];
    const scenes = scenesRaw
      .map((s) => String((s as { sceneName?: string }).sceneName ?? ""))
      .filter(Boolean);

    return {
      obsVersion: String(versionInfo.obsVersion ?? "OBS"),
      scenes,
    };
  }

  async call(
    requestType: string,
    requestData?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("No hay sesion activa con OBS WebSocket.");
    }
    const requestId = `mps_${this.reqCounter++}`;
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Timeout ejecutando ${requestType} en OBS.`));
      }, 6000);

      this.pending.set(requestId, {
        resolve: (data) => {
          window.clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          window.clearTimeout(timer);
          reject(err);
        },
      });

      ws.send(
        JSON.stringify({
          op: 6,
          d: {
            requestType,
            requestId,
            ...(requestData ? { requestData } : {}),
          },
        }),
      );
    });
  }

  async setupStreamScene(params: {
    sceneName: string;
    stageUrl?: string;
    overlayUrl: string;
  }): Promise<{ createdScene: boolean; sourcesAdded: string[] }> {
    const sceneList = await this.call("GetSceneList");
    const scenesRaw = Array.isArray(sceneList.scenes) ? sceneList.scenes : [];
    const existingScenes = new Set(
      scenesRaw.map((s) => String((s as { sceneName?: string }).sceneName ?? "")),
    );

    let createdScene = false;
    if (!existingScenes.has(params.sceneName)) {
      await this.call("CreateScene", { sceneName: params.sceneName });
      createdScene = true;
    }

    const sourcesAdded: string[] = [];
    const upsertBrowserSource = async (inputName: string, url: string) => {
      try {
        await this.call("CreateInput", {
          sceneName: params.sceneName,
          inputName,
          inputKind: "browser_source",
          inputSettings: {
            url,
            width: 1280,
            height: 720,
            fps: 30,
            reroute_audio: false,
          },
          sceneItemEnabled: true,
        });
        sourcesAdded.push(inputName);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("601")) {
          // La fuente ya existia: actualizamos su URL
          await this.call("SetInputSettings", {
            inputName,
            inputSettings: { url, width: 1280, height: 720 },
            overlay: true,
          });
          sourcesAdded.push(`${inputName} (actualizada)`);
        } else {
          throw err;
        }
      }
    };

    if (params.stageUrl) {
      await upsertBrowserSource("viralive.app - Video IA", params.stageUrl);
    }
    await upsertBrowserSource("viralive.app - Overlay Alertas", params.overlayUrl);
    await this.call("SetCurrentProgramScene", { sceneName: params.sceneName });

    return { createdScene, sourcesAdded };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pending.clear();
  }
}

export function generateCleanObsLuaScript(panelOrigin: string): string {
  const cleanOrigin = panelOrigin.replace(/\/+$/, "");
  return `-- viralive.app - Script limpio para OBS Studio (Herramientas -> Scripts)
-- Creado desde cero (clean-room) sin credenciales ni dependencias externas.

obs = obslua

local panel_origin = "${cleanOrigin}"
local scene_name = "viralive.app - En Vivo"

function script_description()
  return "Crea automaticamente la escena y las fuentes de navegador limpias para conectar viralive.app con OBS Studio."
end

function script_properties()
  local props = obs.obs_properties_create()
  obs.obs_properties_add_text(props, "panel_origin", "URL base de viralive.app", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_text(props, "scene_name", "Nombre de escena OBS", obs.OBS_TEXT_DEFAULT)
  obs.obs_properties_add_button(props, "btn_setup", "Crear / Actualizar escena viralive.app", create_studio_scene)
  return props
end

function script_defaults(settings)
  obs.obs_data_set_default_string(settings, "panel_origin", "${cleanOrigin}")
  obs.obs_data_set_default_string(settings, "scene_name", "viralive.app - En Vivo")
end

function script_update(settings)
  panel_origin = obs.obs_data_get_string(settings, "panel_origin")
  scene_name = obs.obs_data_get_string(settings, "scene_name")
end

local function ensure_browser_source(scene, source_name, url)
  local source = obs.obs_get_source_by_name(source_name)
  local settings = obs.obs_data_create()
  obs.obs_data_set_string(settings, "url", url)
  obs.obs_data_set_int(settings, "width", 1280)
  obs.obs_data_set_int(settings, "height", 720)
  obs.obs_data_set_int(settings, "fps", 30)

  if source == nil then
    source = obs.obs_source_create("browser_source", source_name, settings, nil)
    obs.obs_scene_add(scene, source)
  else
    obs.obs_source_update(source, settings)
  end

  obs.obs_data_release(settings)
  obs.obs_source_release(source)
end

function create_studio_scene(props, prop)
  local target = obs.obs_get_source_by_name(scene_name)
  local scene = nil
  if target == nil then
    scene = obs.obs_scene_create(scene_name)
  else
    scene = obs.obs_scene_from_source(target)
  end

  if scene ~= nil then
    local base = string.gsub(panel_origin, "/+$", "")
    ensure_browser_source(scene, "viralive.app - Overlay Alertas", base .. "/obs-overlay")
    if target == nil then
      local created_src = obs.obs_scene_get_source(scene)
      obs.obs_frontend_set_current_scene(created_src)
      obs.obs_scene_release(scene)
    end
  end

  if target ~= nil then
    obs.obs_source_release(target)
  end
  return true
end
`;
}
