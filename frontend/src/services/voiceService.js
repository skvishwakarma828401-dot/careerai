/**
 * Voice Service: Web Audio API, Speech-to-Text (STT), and Text-to-Speech (TTS)
 */

class VoiceService {
  constructor() {
    this.recognition = null;
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.animationFrameId = null;
    this.isListening = false;
    this.speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
  }

  /**
   * Check browser support for Speech APIs
   */
  getSupport() {
    const isSTTSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    const isTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const isAudioContextSupported = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
    const isMediaDevicesSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    return {
      isSTTSupported,
      isTTSSupported,
      isAudioContextSupported,
      isMediaDevicesSupported,
      isFullySupported: isSTTSupported && isTTSSupported && isMediaDevicesSupported,
    };
  }

  /**
   * Request microphone permission & initialize AudioContext for visualizer
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise<MediaStream>}
   */
  async initMicrophone(canvas) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser environment.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;

      // Initialize Web Audio Analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && canvas) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128;
        source.connect(this.analyser);
        this.startWaveformVisualizer(canvas);
      }

      return stream;
    } catch (err) {
      console.warn('[VoiceService] Microphone permission error:', err);
      throw new Error(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : `Microphone initialization error: ${err.message}`
      );
    }
  }

  /**
   * Render real-time audio waveform on HTML5 Canvas
   * @param {HTMLCanvasElement} canvas
   */
  startWaveformVisualizer(canvas) {
    if (!canvas || !this.analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.analyser) return;
      this.animationFrameId = requestAnimationFrame(draw);

      this.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Gradient color for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366F1');
        gradient.addColorStop(1, '#10B981');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  /**
   * Start Speech-to-Text recognition
   * @param {Object} callbacks
   * @param {Function} callbacks.onTranscript - Receives interim & final transcript
   * @param {Function} callbacks.onError - Error callback
   * @param {Function} callbacks.onEnd - Recognition ended
   */
  startListening({ onTranscript, onError, onEnd }) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      if (onError) onError(new Error('Speech recognition is not supported in this browser. Please use text mode.'));
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (onTranscript) {
          onTranscript({
            finalTranscript,
            interimTranscript,
            fullTranscript: (finalTranscript + ' ' + interimTranscript).trim(),
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[VoiceService] Speech recognition event error:', event.error);
        if (onError && event.error !== 'no-speech') {
          onError(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
      this.isListening = true;
    } catch (err) {
      if (onError) onError(err);
    }
  }

  /**
   * Stop Speech-to-Text recognition and release audio tracks
   */
  stopListening() {
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Text-to-Speech: Speak text aloud using SpeechSynthesis
   * @param {string} text
   * @param {Object} [options]
   * @param {number} [options.rate=1.0]
   * @param {number} [options.pitch=1.0]
   * @param {Function} [options.onStart]
   * @param {Function} [options.onEnd]
   */
  speakText(text, options = {}) {
    if (!this.speechSynthesis) return;

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.lang = 'en-US';

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;

    // Pick natural English voice if available
    const voices = this.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    this.speechSynthesis.speak(utterance);
  }

  /**
   * Stop speaking audio
   */
  stopSpeaking() {
    if (this.speechSynthesis && this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
  }
}

export default new VoiceService();
