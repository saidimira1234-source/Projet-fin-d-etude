/* =============================================
   قارئ المستقبل — JavaScript الأساسي المشترك
   وظائف تفاعلية مشتركة بين جميع الأنشطة
   Islem Slim & Amira Saidi — 2026
   ============================================= */

// =================== نظام النقاط والتقدم ===================
const NeuroPedago = {
  
  // === تخزين محلي ===
  storage: {
    getProgress() {
      const data = localStorage.getItem('neuro_progress');
      return data ? JSON.parse(data) : {};
    },
    
    setProgress(activityId, score, maxScore) {
      const progress = this.getProgress();
      progress[activityId] = {
        score,
        maxScore,
        completed: true,
        date: new Date().toISOString(),
        stars: Math.ceil((score / maxScore) * 3)
      };
      localStorage.setItem('neuro_progress', JSON.stringify(progress));
    },
    
    isCompleted(activityId) {
      const progress = this.getProgress();
      return progress[activityId]?.completed || false;
    },
    
    getStars(activityId) {
      const progress = this.getProgress();
      return progress[activityId]?.stars || 0;
    },
    
    getTotalCompleted() {
      const progress = this.getProgress();
      return Object.values(progress).filter(p => p.completed).length;
    },
    
    resetAll() {
      localStorage.removeItem('neuro_progress');
    }
  },
  
  // === المؤقت الزمني ===
  Timer: class {
    constructor(seconds, onTick, onEnd) {
      this.total = seconds;
      this.remaining = seconds;
      this.onTick = onTick;
      this.onEnd = onEnd;
      this.interval = null;
      this.running = false;
    }
    
    start() {
      if (this.running) return;
      this.running = true;
      this.interval = setInterval(() => {
        this.remaining--;
        const percent = (this.remaining / this.total) * 100;
        if (this.onTick) this.onTick(this.remaining, percent);
        if (this.remaining <= 0) {
          this.stop();
          if (this.onEnd) this.onEnd();
        }
      }, 1000);
    }
    
    stop() {
      this.running = false;
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }
    
    reset() {
      this.stop();
      this.remaining = this.total;
    }
    
    getFormatted() {
      const m = Math.floor(this.remaining / 60);
      const s = this.remaining % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
  },

  // === مؤقت تصاعدي (Stopwatch) ===
  Stopwatch: class {
    constructor(onTick) {
      this.elapsed = 0;
      this.onTick = onTick;
      this.interval = null;
      this.running = false;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.interval = setInterval(() => {
        this.elapsed++;
        if (this.onTick) this.onTick(this.elapsed);
      }, 1000);
    }

    stop() {
      this.running = false;
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }

    reset() {
      this.stop();
      this.elapsed = 0;
    }

    getFormatted() {
      const m = Math.floor(this.elapsed / 60);
      const s = this.elapsed % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
  },
  
  // === النجوم ===
  renderStars(container, count) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    el.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const star = document.createElement('span');
      star.className = 'star' + (i <= count ? ' active' : '');
      star.textContent = '⭐';
      if (i <= count) {
        star.style.animationDelay = (i * 0.15) + 's';
      }
      el.appendChild(star);
    }
  },
  
  // === التغذية الراجعة ===
  showFeedback(elementId, type, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = 'feedback show ' + type;
    el.textContent = message;
    if (type === 'error') {
      setTimeout(() => {
        el.className = 'feedback';
      }, 2500);
    }
  },
  
  hideFeedback(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.className = 'feedback';
  },
  
  // === تأثيرات صوتية بسيطة (Web Audio API) ===
  sounds: {
    ctx: null,
    
    getContext() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return this.ctx;
    },
    
    playTone(frequency, duration, type = 'sine') {
      try {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch(e) { /* ignore audio errors */ }
    },
    
    correct() { this.playTone(523, 0.15); setTimeout(() => this.playTone(659, 0.15), 100); setTimeout(() => this.playTone(784, 0.2), 200); },
    wrong() { this.playTone(200, 0.3, 'square'); },
    click() { this.playTone(800, 0.05); },
    complete() { 
      this.playTone(523, 0.1); 
      setTimeout(() => this.playTone(659, 0.1), 100); 
      setTimeout(() => this.playTone(784, 0.1), 200); 
      setTimeout(() => this.playTone(1047, 0.3), 300); 
    },
    tick() { this.playTone(1000, 0.02); }
  },
  
  // === السحب والإفلات ===
  setupDragDrop(draggableSelector, dropZoneSelector, onDrop) {
    const draggables = document.querySelectorAll(draggableSelector);
    const dropZones = document.querySelectorAll(dropZoneSelector);
    
    draggables.forEach(item => {
      item.setAttribute('draggable', 'true');
      
      item.addEventListener('dragstart', (e) => {
        item.classList.add('dragging');
        e.dataTransfer.setData('text/plain', item.dataset.value || item.textContent);
        e.dataTransfer.setData('text/id', item.id || '');
      });
      
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });
      
      // Touch support
      let touchClone = null;
      item.addEventListener('touchstart', (e) => {
        item.classList.add('dragging');
        touchClone = item.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.7';
        touchClone.style.zIndex = '1000';
        document.body.appendChild(touchClone);
      }, { passive: true });
      
      item.addEventListener('touchmove', (e) => {
        if (touchClone) {
          const touch = e.touches[0];
          touchClone.style.left = (touch.clientX - 30) + 'px';
          touchClone.style.top = (touch.clientY - 30) + 'px';
        }
      }, { passive: true });
      
      item.addEventListener('touchend', (e) => {
        item.classList.remove('dragging');
        if (touchClone) {
          document.body.removeChild(touchClone);
          touchClone = null;
        }
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        if (dropTarget) {
          const zone = dropTarget.closest(dropZoneSelector);
          if (zone && onDrop) {
            onDrop(item, zone);
          }
        }
      });
    });
    
    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('active');
      });
      
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('active');
      });
      
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('active');
        const value = e.dataTransfer.getData('text/plain');
        const id = e.dataTransfer.getData('text/id');
        const draggedEl = id ? document.getElementById(id) : 
          document.querySelector(`${draggableSelector}.dragging`) ||
          [...document.querySelectorAll(draggableSelector)].find(el => (el.dataset.value || el.textContent) === value);
        if (onDrop && draggedEl) onDrop(draggedEl, zone);
      });
    });
  },
  
  // === خلط مصفوفة عشوائيًا (Fisher-Yates) ===
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  
  // === اختيار عنصر عشوائي ===
  randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  
  // === إنشاء عنصر HTML ===
  createElement(tag, className, text, attrs = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  },
  
  // === إظهار نتيجة النشاط ===
  showResult(containerId, score, maxScore, activityId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const stars = Math.ceil((score / maxScore) * 3);
    const percent = Math.round((score / maxScore) * 100);
    
    // حفظ التقدم
    if (activityId) {
      this.storage.setProgress(activityId, score, maxScore);
    }
    
    // تشغيل صوت الإنجاز
    this.sounds.complete();
    
    let message = '';
    if (percent >= 90) message = '🎉 ممتاز! أداء رائع جدًا!';
    else if (percent >= 70) message = '👏 أحسنت! عمل جيد!';
    else if (percent >= 50) message = '💪 جيد، حاول مرة أخرى لتحسين نتيجتك';
    else message = '🔄 لا بأس، المحاولة خطوة نحو النجاح!';
    
    container.innerHTML = `
      <div class="activity-section animate-in" style="text-align:center;">
        <h2 style="justify-content:center;">🏆 النتيجة</h2>
        <div class="score-display">
          <div>
            <div class="score-num">${score} / ${maxScore}</div>
            <div class="score-label">${percent}%</div>
          </div>
        </div>
        <div class="stars" id="result-stars"></div>
        <p style="font-size:1.2rem; font-weight:700; margin:20px 0; color:var(--text-primary);">${message}</p>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="location.reload()">🔄 إعادة المحاولة</button>
          <button class="btn btn-outline" onclick="history.back()">↩ العودة</button>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      this.renderStars('result-stars', stars);
    }, 300);
    
    container.scrollIntoView({ behavior: 'smooth' });
  },
  
  // === كلمات وجمل للأنشطة ===
  wordBank: {
    // كلمات بسيطة للصف الثالث
    grade3: [
      'كِتَاب', 'مَدْرَسَة', 'قَلَم', 'وَرْدَة', 'شَمْس', 'قَمَر', 
      'بَحْر', 'نَهْر', 'شَجَرَة', 'طَائِر', 'سَمَكَة', 'حَدِيقَة',
      'أُسْرَة', 'صَدِيق', 'مَعْلِم', 'تِلْمِيذ', 'فَرَاشَة', 'زَهْرَة',
      'سَمَاء', 'أَرْض', 'مَاء', 'هَوَاء', 'طَعَام', 'لُعْبَة'
    ],
    // كلمات أكثر تعقيدًا للصف الرابع
    grade4: [
      'مَكْتَبَة', 'حَاسُوب', 'اِخْتِرَاع', 'مُغَامَرَة', 'اِكْتِشَاف',
      'مَسْؤُولِيَّة', 'تَعَاوُن', 'مُسَابَقَة', 'مَعْلُومَات', 'تَجْرِبَة',
      'طَبِيعَة', 'حَضَارَة', 'ثَقَافَة', 'رِيَاضَة', 'مُوسِيقَى',
      'ذَكَاء', 'إِبْدَاع', 'شَجَاعَة', 'صَدَاقَة', 'مَحَبَّة'
    ],
    // جمل قصيرة
    sentences: [
      'ذَهَبَ أَحْمَدُ إِلَى الْمَدْرَسَةِ صَبَاحًا.',
      'تَلْعَبُ مَرْيَمُ فِي الْحَدِيقَةِ مَعَ صَدِيقَتِهَا.',
      'قَرَأَ التِّلْمِيذُ قِصَّةً جَمِيلَةً.',
      'تُشْرِقُ الشَّمْسُ كُلَّ صَبَاحٍ.',
      'يَسْبَحُ السَّمَكُ فِي الْبَحْرِ.',
      'زَرَعَ الْفَلَّاحُ الْأَشْجَارَ فِي الْحَقْلِ.',
      'تَطِيرُ الْفَرَاشَاتُ فَوْقَ الْأَزْهَارِ.',
      'يَقْرَأُ الْأَبُ قِصَّةً لِأَطْفَالِهِ قَبْلَ النَّوْمِ.'
    ]
  },
  
  // === نظام النطق المتعدد الطبقات ===
  // Layer 1: Audio element with Google Translate TTS (most reliable)
  // Layer 2: Web Speech API (if available with Arabic voice)
  // Layer 3: Returns false → callers show text fallback

  _ttsAudio: null,

  _speakViaAudio(text) {
    // Try local proxy first (no CORS), then direct Google TTS as fallback
    const encodedText = encodeURIComponent(text);
    const urls = [
      '/api/tts?tl=ar&q=' + encodedText,
      'https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=' + encodedText,
    ];

    const tryUrl = (index) => {
      if (index >= urls.length) return Promise.resolve(false);
      return new Promise((resolve) => {
        try {
          if (this._ttsAudio) {
            this._ttsAudio.pause();
            this._ttsAudio.removeAttribute('src');
          }
          const audio = new Audio();
          this._ttsAudio = audio;
          audio.src = urls[index];
          
          let settled = false;
          const done = (val) => { if (!settled) { settled = true; resolve(val); } };

          audio.onended = () => done(true);
          audio.onerror = () => {
            console.warn('TTS URL failed:', urls[index]);
            // Try next URL
            tryUrl(index + 1).then(done);
          };
          audio.oncanplaythrough = () => {
            audio.play().then(() => {
              // Playing — wait for onended
            }).catch(() => {
              tryUrl(index + 1).then(done);
            });
          };
          
          // Timeout per URL: 4 seconds
          setTimeout(() => {
            if (!settled) {
              audio.pause();
              tryUrl(index + 1).then(done);
            }
          }, 4000);
          
          audio.load();
        } catch (e) {
          console.warn('Audio TTS error:', e);
          tryUrl(index + 1).then(resolve);
        }
      });
    };

    return tryUrl(0);
  },

  _voices: [],
  _voicesLoaded: false,
  _hasArabicVoice: false,

  _loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      this._voices = speechSynthesis.getVoices();
      this._voicesLoaded = this._voices.length > 0;
      this._hasArabicVoice = this._voices.some(v => v.lang.toLowerCase().includes('ar'));
    };
    load();
    if (!this._voicesLoaded) {
      speechSynthesis.addEventListener('voiceschanged', () => load(), { once: true });
    }
  },

  _findArabicVoice() {
    const prefs = ['ar-SA', 'ar-EG', 'ar-AE', 'ar-DZ', 'ar-MA', 'ar'];
    for (const lang of prefs) {
      const v = this._voices.find(v => v.lang === lang || v.lang.startsWith(lang));
      if (v) return v;
    }
    return this._voices.find(v => v.lang.toLowerCase().includes('ar')) || null;
  },

  _speakViaWebSpeech(text, rate) {
    if (!('speechSynthesis' in window) || !this._hasArabicVoice) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      speechSynthesis.cancel();
      let settled = false;
      const done = (val) => { if (!settled) { settled = true; resolve(val); } };

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = rate;
        utterance.pitch = 1;

        const voice = this._findArabicVoice();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }

        const keepAlive = setInterval(() => {
          if (!speechSynthesis.speaking) { clearInterval(keepAlive); return; }
          speechSynthesis.pause();
          speechSynthesis.resume();
        }, 5000);

        utterance.onend = () => { clearInterval(keepAlive); done(true); };
        utterance.onerror = () => { clearInterval(keepAlive); done(false); };

        speechSynthesis.speak(utterance);
        setTimeout(() => { clearInterval(keepAlive); done(false); }, 8000);
      }, 100);
    });
  },

  /**
   * Main speak function - tries multiple methods
   * Returns Promise<boolean> - true if audio played, false if caller should show text
   */
  speak(text, rate = 0.9) {
    // Layer 1: Try Audio element with Google Translate TTS
    return this._speakViaAudio(text).then((ok) => {
      if (ok) return true;
      // Layer 2: Try Web Speech API
      return this._speakViaWebSpeech(text, rate);
    }).then((ok) => {
      if (ok) return true;
      console.warn('All TTS methods failed for:', text);
      return false;
    });
  },
  
  // === تحريك العنصر ===
  animateElement(el, animationClass, duration = 500) {
    el.classList.add(animationClass);
    setTimeout(() => el.classList.remove(animationClass), duration);
  },

  // === نظام تسجيل وتقييم الصوت ===
  VoiceRecorder: {
    mediaRecorder: null,
    audioChunks: [],
    recognition: null,
    isRecording: false,
    recognizedText: '',
    hasRecognition: false,

    init() {
      // Check Web Speech Recognition API availability
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.hasRecognition = !!SpeechRecognition;
      if (this.hasRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ar-SA';
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 3;
      }
    },

    /**
     * Start recording voice + speech recognition
     * @param {Function} onResult - callback with {text, audioBlob, audioUrl}
     * @param {Function} onError - callback with error message
     */
    startRecording(onResult, onError) {
      this.recognizedText = '';
      this.audioChunks = [];
      this.isRecording = true;

      // Start speech recognition if available
      if (this.hasRecognition) {
        try {
          this.recognition.onresult = (event) => {
            let text = '';
            for (let i = 0; i < event.results.length; i++) {
              text += event.results[i][0].transcript + ' ';
            }
            this.recognizedText = text.trim();
          };
          this.recognition.onerror = (e) => {
            console.warn('Speech recognition error:', e.error);
          };
          this.recognition.start();
        } catch (e) {
          console.warn('Could not start recognition:', e);
        }
      }

      // Start audio recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.mediaRecorder = new MediaRecorder(stream);
          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.audioChunks.push(e.data);
          };
          this.mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            if (onResult) {
              onResult({
                text: this.recognizedText,
                audioBlob: blob,
                audioUrl: url
              });
            }
          };
          this.mediaRecorder.start();
        })
        .catch(err => {
          this.isRecording = false;
          if (onError) onError('لم يتم السماح بالوصول إلى الميكروفون. يرجى السماح بالتسجيل.');
          console.error('Microphone error:', err);
        });
    },

    stopRecording() {
      this.isRecording = false;
      if (this.recognition && this.hasRecognition) {
        try { this.recognition.stop(); } catch(e) {}
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    },

    /**
     * Evaluate similarity between recognized text and expected text
     * @param {string} recognized - text from speech recognition
     * @param {string} expected - expected text to read
     * @returns {object} {score, percent, stars, message}
     */
    evaluate(recognized, expected) {
      if (!recognized || recognized.trim().length === 0) {
        return {
          score: 0,
          percent: 0,
          stars: 0,
          message: '⚠ لم يتم التعرف على صوتك. تأكد من القراءة بصوت واضح.',
          noRecognition: true
        };
      }

      // Strip diacritics for comparison
      const strip = (t) => t.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '').trim();

      const recognizedWords = strip(recognized).split(/\s+/).filter(w => w.length > 0);
      const expectedWords = strip(expected).split(/\s+/).filter(w => w.length > 0);

      // Count matching words (order-independent, allowing approximate matches)
      let matchCount = 0;
      const usedIndices = new Set();

      for (const rWord of recognizedWords) {
        let bestMatch = -1;
        let bestSimilarity = 0;
        for (let i = 0; i < expectedWords.length; i++) {
          if (usedIndices.has(i)) continue;
          const sim = this._wordSimilarity(rWord, expectedWords[i]);
          if (sim > bestSimilarity && sim >= 0.6) {
            bestSimilarity = sim;
            bestMatch = i;
          }
        }
        if (bestMatch >= 0) {
          matchCount += bestSimilarity;
          usedIndices.add(bestMatch);
        }
      }

      const percent = Math.min(100, Math.round((matchCount / expectedWords.length) * 100));
      const stars = percent >= 80 ? 3 : percent >= 50 ? 2 : percent >= 20 ? 1 : 0;

      let message = '';
      if (percent >= 80) message = '🎉 ممتاز! قراءة رائعة وواضحة!';
      else if (percent >= 60) message = '👏 أحسنت! قراءة جيدة جداً!';
      else if (percent >= 40) message = '👍 جيد، حاول أن تقرأ بوضوح أكثر';
      else if (percent >= 20) message = '💪 لا بأس، تدرّب أكثر على النطق الواضح';
      else message = '🔄 حاول مرة أخرى بصوت أعلى وأوضح';

      return { score: Math.round(matchCount), percent, stars, message, noRecognition: false };
    },

    _wordSimilarity(a, b) {
      if (a === b) return 1;
      const maxLen = Math.max(a.length, b.length);
      if (maxLen === 0) return 1;
      const distance = this._levenshtein(a, b);
      return 1 - distance / maxLen;
    },

    _levenshtein(a, b) {
      const m = a.length, n = b.length;
      const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          dp[i][j] = a[i-1] === b[j-1]
            ? dp[i-1][j-1]
            : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
      }
      return dp[m][n];
    },

    /**
     * Create recording UI button group
     * @param {string} containerId - ID of container element
     * @param {string} expectedText - text to evaluate against
     * @param {Function} onEvalComplete - callback({score, percent, stars, message, audioUrl})
     */
    createRecordingUI(containerId, expectedText, onEvalComplete) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div style="text-align:center; margin:15px 0;">
          <button class="btn btn-primary btn-lg" id="rec-start-btn" style="background:#E53935; border-color:#E53935;">
            🎙️ ابدأ التسجيل
          </button>
          <button class="btn btn-primary btn-lg" id="rec-stop-btn" style="display:none; background:#E53935; border-color:#C62828; animation: pulse 1s infinite;">
            ⏹ أوقف التسجيل
          </button>
          <div id="rec-status" style="margin-top:10px; font-weight:600; color:var(--text-secondary);"></div>
          <div id="rec-playback" style="display:none; margin-top:15px;">
            <audio id="rec-audio" controls style="max-width:100%;"></audio>
          </div>
          <div id="rec-result" style="display:none; margin-top:15px; padding:15px; border-radius:12px; background:var(--bg-secondary); border:2px solid var(--border);"></div>
        </div>
      `;

      const startBtn = document.getElementById('rec-start-btn');
      const stopBtn = document.getElementById('rec-stop-btn');
      const status = document.getElementById('rec-status');

      startBtn.addEventListener('click', () => {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        status.textContent = '🔴 جارٍ التسجيل... اقرأ بصوت عالٍ وواضح';
        status.style.color = '#E53935';

        NeuroPedago.VoiceRecorder.startRecording(
          (result) => {
            // Recording finished
            stopBtn.style.display = 'none';
            status.textContent = '✅ تم التسجيل بنجاح';
            status.style.color = 'var(--success)';

            // Show playback
            const playback = document.getElementById('rec-playback');
            playback.style.display = 'block';
            document.getElementById('rec-audio').src = result.audioUrl;

            // Evaluate
            const evaluation = NeuroPedago.VoiceRecorder.evaluate(result.text, expectedText);
            evaluation.audioUrl = result.audioUrl;

            // Show result
            const resultDiv = document.getElementById('rec-result');
            resultDiv.style.display = 'block';

            if (evaluation.noRecognition) {
              resultDiv.innerHTML = `
                <p style="font-weight:700; color:var(--orange);">${evaluation.message}</p>
                <p style="font-size:0.9rem; color:var(--text-light); margin-top:8px;">💡 يمكنك سماع تسجيلك أعلاه للتحقق من قراءتك.</p>
                <button class="btn btn-outline btn-sm" onclick="NeuroPedago.VoiceRecorder.createRecordingUI('${containerId}', \`${expectedText.replace(/`/g, '\\`')}\`, arguments.callee)" style="margin-top:10px;">🔄 أعد التسجيل</button>
              `;
              // Give partial score when recognition fails but recording exists
              evaluation.percent = 50;
              evaluation.stars = 2;
              evaluation.message = '📱 تم تسجيل صوتك. التقييم التلقائي غير متوفر.';
            } else {
              resultDiv.innerHTML = `
                <div style="font-size:1.5rem; font-weight:900; color:var(--orange-dark); margin-bottom:8px;">${evaluation.percent}%</div>
                <p style="font-weight:700;">${evaluation.message}</p>
              `;
            }

            if (onEvalComplete) onEvalComplete(evaluation);
          },
          (error) => {
            stopBtn.style.display = 'none';
            startBtn.style.display = 'inline-flex';
            status.textContent = '❌ ' + error;
            status.style.color = 'var(--error)';
          }
        );
      });

      stopBtn.addEventListener('click', () => {
        NeuroPedago.VoiceRecorder.stopRecording();
      });
    }
  }
};

// =================== تهيئة عند تحميل الصفحة ===================
document.addEventListener('DOMContentLoaded', () => {
  // تحميل الأصوات مسبقاً
  NeuroPedago._loadVoices();

  // تهيئة نظام تسجيل الصوت
  NeuroPedago.VoiceRecorder.init();

  // تحديث العداد في الصفحة الرئيسية
  const totalEl = document.getElementById('total-completed');
  if (totalEl) {
    totalEl.textContent = NeuroPedago.storage.getTotalCompleted();
  }
  
  // إضافة تأثير ظهور للعناصر عند التمرير
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  
  document.querySelectorAll('.activity-section, .category-card, .activity-link, .pillar-card').forEach(el => {
    observer.observe(el);
  });
});
