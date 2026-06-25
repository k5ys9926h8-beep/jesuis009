use serde::{Deserialize, Serialize};
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub api_key: String,
    pub provider: String,
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub system_prompt: String,
    pub temperature: f64,
    pub max_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StreamChunk {
    pub content: String,
    pub done: bool,
}

#[tauri::command]
pub async fn send_message(
    app: tauri::AppHandle,
    request: ChatRequest,
) -> Result<String, String> {
    match request.provider.as_str() {
        "anthropic" => send_anthropic_message(app, request).await,
        "openai" => send_openai_message(app, request).await,
        _ => Err("Unsupported provider".to_string()),
    }
}

async fn send_anthropic_message(
    app: tauri::AppHandle,
    request: ChatRequest,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let messages: Vec<serde_json::Value> = request
        .messages
        .iter()
        .map(|m| {
            serde_json::json!({
                "role": m.role,
                "content": m.content,
            })
        })
        .collect();

    let body = serde_json::json!({
        "model": request.model,
        "max_tokens": request.max_tokens,
        "temperature": request.temperature,
        "system": request.system_prompt,
        "messages": messages,
        "stream": true,
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &request.api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error: {}", error_text));
    }

    let mut full_response = String::new();
    let mut stream = response.bytes_stream();

    use futures::StreamExt;

    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes).to_string();
                buffer.push_str(&text);

                // Process complete SSE events from buffer
                while let Some(event_end) = buffer.find("\n\n") {
                    let event = buffer[..event_end].to_string();
                    buffer = buffer[event_end + 2..].to_string();

                    for line in event.lines() {
                        if let Some(data) = line.strip_prefix("data: ") {
                            if data == "[DONE]" {
                                continue;
                            }
                            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                                if let Some(delta) = parsed.get("delta") {
                                    if let Some(text) = delta.get("text").and_then(|t| t.as_str()) {
                                        full_response.push_str(text);
                                        let _ = app.emit("stream-chunk", StreamChunk {
                                            content: text.to_string(),
                                            done: false,
                                        });
                                    }
                                }
                                // Check for message_stop
                                if parsed.get("type").and_then(|t| t.as_str()) == Some("message_stop") {
                                    let _ = app.emit("stream-chunk", StreamChunk {
                                        content: String::new(),
                                        done: true,
                                    });
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                return Err(format!("Stream error: {}", e));
            }
        }
    }

    // Emit final done signal
    let _ = app.emit("stream-chunk", StreamChunk {
        content: String::new(),
        done: true,
    });

    Ok(full_response)
}

async fn send_openai_message(
    app: tauri::AppHandle,
    request: ChatRequest,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let mut messages: Vec<serde_json::Value> = vec![serde_json::json!({
        "role": "system",
        "content": request.system_prompt,
    })];

    for m in &request.messages {
        messages.push(serde_json::json!({
            "role": m.role,
            "content": m.content,
        }));
    }

    let body = serde_json::json!({
        "model": request.model,
        "max_tokens": request.max_tokens,
        "temperature": request.temperature,
        "messages": messages,
        "stream": true,
    });

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", request.api_key))
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error: {}", error_text));
    }

    let mut full_response = String::new();
    let mut stream = response.bytes_stream();

    use futures::StreamExt;

    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes).to_string();
                buffer.push_str(&text);

                while let Some(event_end) = buffer.find("\n\n") {
                    let event = buffer[..event_end].to_string();
                    buffer = buffer[event_end + 2..].to_string();

                    for line in event.lines() {
                        if let Some(data) = line.strip_prefix("data: ") {
                            if data == "[DONE]" {
                                let _ = app.emit("stream-chunk", StreamChunk {
                                    content: String::new(),
                                    done: true,
                                });
                                continue;
                            }
                            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                                if let Some(choices) = parsed.get("choices").and_then(|c| c.as_array()) {
                                    if let Some(delta) = choices.first().and_then(|c| c.get("delta")) {
                                        if let Some(content) = delta.get("content").and_then(|t| t.as_str()) {
                                            full_response.push_str(content);
                                            let _ = app.emit("stream-chunk", StreamChunk {
                                                content: content.to_string(),
                                                done: false,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                return Err(format!("Stream error: {}", e));
            }
        }
    }

    let _ = app.emit("stream-chunk", StreamChunk {
        content: String::new(),
        done: true,
    });

    Ok(full_response)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![send_message])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
