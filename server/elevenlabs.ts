import { VoiceNote } from "@shared/schema";

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  samples: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
  category: string;
  fine_tuning: {
    is_allowed: boolean;
    state: object;
    verification: object;
    slice_ids: string[];
    manual_verification: object;
    manual_verification_requested: boolean;
  };
  labels: object;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: object;
  sharing: object;
  high_quality_base_model_ids: string[];
}

interface CloneVoiceRequest {
  name: string;
  files: File[];
  description?: string;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is required");
    }
    this.apiKey = process.env.ELEVENLABS_API_KEY;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "xi-api-key": this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    return response;
  }

  // Get all available voices
  async getVoices(): Promise<ElevenLabsVoice[]> {
    const response = await this.makeRequest("/voices");
    const data = await response.json();
    return data.voices;
  }

  // Clone a voice from audio samples
  async cloneVoice(request: CloneVoiceRequest): Promise<ElevenLabsVoice> {
    const formData = new FormData();
    formData.append("name", request.name);
    if (request.description) {
      formData.append("description", request.description);
    }

    // Add audio files
    request.files.forEach((file, index) => {
      formData.append("files", file, `sample_${index}.wav`);
    });

    const response = await this.makeRequest("/voices/add", {
      method: "POST",
      body: formData,
    });

    return response.json();
  }

  // Generate speech from text using a specific voice
  async generateSpeech(text: string, voiceId: string): Promise<Buffer> {
    const response = await this.makeRequest(`/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Get voice by ID
  async getVoice(voiceId: string): Promise<ElevenLabsVoice> {
    const response = await this.makeRequest(`/voices/${voiceId}`);
    return response.json();
  }

  // Delete a cloned voice
  async deleteVoice(voiceId: string): Promise<void> {
    await this.makeRequest(`/voices/${voiceId}`, {
      method: "DELETE",
    });
  }

  // Get user subscription info
  async getUserInfo() {
    const response = await this.makeRequest("/user");
    return response.json();
  }
}

export const elevenLabsService = new ElevenLabsService();

// Generate "Future Me" advice using voice cloning
export async function generateFutureMeAdvice(
  voiceNotes: VoiceNote[],
  userVoiceId: string
): Promise<{ text: string; audioBuffer: Buffer }> {
  // This would integrate with OpenAI to analyze voice notes and generate advice
  const advice = "Based on your recent voice entries, I notice you've been focusing a lot on productivity. As your future self, I'd suggest taking some time for reflection and ensuring you're not burning out. Remember to celebrate small wins and maintain work-life balance.";

  const audioBuffer = await elevenLabsService.generateSpeech(advice, userVoiceId);

  return {
    text: advice,
    audioBuffer,
  };
}