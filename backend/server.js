require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const mammoth = require('mammoth');
const PDFParser = require('pdf2json');

function parsePdf(buffer) {
  return new Promise(function(resolve, reject) {
    var parser = new PDFParser();
    parser.on('pdfParser_dataError', function(err) { reject(new Error(err.parserError)); });
    parser.on('pdfParser_dataReady', function(data) {
      var text = data.Pages.map(function(page) {
        return page.Texts.map(function(t) {
          return decodeURIComponent(t.R.map(function(r) { return r.T; }).join(''));
        }).join(' ');
      }).join('\n');
      resolve(text);
    });
    parser.parseBuffer(buffer);
  });
}
const multer  = require('multer');
const path    = require('path');

const app    = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// ─── JSONBin ───────────────────────────────────────────────────────────────────
const JSONBIN_BIN_ID  = '69cef0d036566621a8740cdb';
const JSONBIN_API_KEY = '$2a$10$cip66R4w.2tIzZWE8g9YkO1PUm.m8qnmKKKb0lZFEFGAoXyxqIPZm';

let jsonbinCache      = null;
let jsonbinCacheDirty = false;

async function getJsonbinRecord() {
  if (jsonbinCache) return jsonbinCache;
  const res = await axios.get('https://api.jsonbin.io/v3/b/' + JSONBIN_BIN_ID + '/latest', {
    headers: { 'X-Master-Key': JSONBIN_API_KEY }
  });
  jsonbinCache = res.data.record || {};
  return jsonbinCache;
}

async function flushJsonbinCache() {
  if (!jsonbinCacheDirty || !jsonbinCache) return;
  jsonbinCacheDirty = false;
  await axios.put('https://api.jsonbin.io/v3/b/' + JSONBIN_BIN_ID,
    jsonbinCache,
    { headers: { 'X-Master-Key': JSONBIN_API_KEY, 'Content-Type': 'application/json' } }
  );
}

// ─── Quiz Night API ────────────────────────────────────────────────────────────
var quizSlotLocks = {};
var LOCK_TTL_MS = 30000; // 30 saniye heartbeat gelmezse kilit düşer

function cleanExpiredLocks() {
  var now = Date.now();
  Object.keys(quizSlotLocks).forEach(function(gno) {
    if (quizSlotLocks[gno] && (now - quizSlotLocks[gno].timestamp) > LOCK_TTL_MS) {
      delete quizSlotLocks[gno];
    }
  });
}

app.get('/api/quiz', async function(req, res) {
  cleanExpiredLocks();
  try {
    var rec = await getJsonbinRecord();
    res.json({ quizData: rec.quizDataStandalone || null, slotLocks: quizSlotLocks });
  } catch(e) {
    res.json({ quizData: null, slotLocks: {} });
  }
});

// Grup kilidi al
app.post('/api/quiz/lock', function(req, res) {
  cleanExpiredLocks();
  var groupNo = String(req.body.groupNo);
  var clientId = req.body.clientId;
  if (!groupNo || !clientId) return res.status(400).json({ error: 'groupNo ve clientId gerekli' });
  var existing = quizSlotLocks[groupNo];
  if (existing && existing.clientId !== clientId) {
    return res.json({ success: false, reason: 'locked' });
  }
  quizSlotLocks[groupNo] = { clientId: clientId, timestamp: Date.now() };
  res.json({ success: true });
});

// Grup kilidini bırak
app.post('/api/quiz/unlock', function(req, res) {
  var groupNo = String(req.body.groupNo);
  var clientId = req.body.clientId;
  if (quizSlotLocks[groupNo] && quizSlotLocks[groupNo].clientId === clientId) {
    delete quizSlotLocks[groupNo];
  }
  res.json({ success: true });
});

// Heartbeat — kilitleri canlı tut; süresi dolmuş kilitleri yeniden al
app.post('/api/quiz/heartbeat', function(req, res) {
  cleanExpiredLocks();
  var clientId = req.body.clientId;
  var groups = req.body.groups || [];
  var failed = []; // başkası almış gruplar
  groups.forEach(function(gno) {
    gno = String(gno);
    var existing = quizSlotLocks[gno];
    if (!existing || existing.clientId === clientId) {
      // Serbest ya da zaten bizim — yenile veya yeniden al
      quizSlotLocks[gno] = { clientId: clientId, timestamp: Date.now() };
    } else {
      // Başkası almış
      failed.push(gno);
    }
  });
  res.json({ success: true, failed: failed });
});

app.post('/api/quiz', async function(req, res) {
  try {
    const quizData = req.body.quizData;
    if (!quizData) return res.status(400).json({ error: 'quizData gerekli' });
    var rec = await getJsonbinRecord();
    var existing = rec.quizDataStandalone;

    // Aynı oturum (sessionId eşleşiyor) ise merge yap; farklı oturum veya yeni etkinlik ise direkt yaz
    var sameSession = existing
      && existing.eventType === quizData.eventType
      && existing.sessionId
      && quizData.sessionId
      && existing.sessionId === quizData.sessionId;

    if (sameSession) {
      var mergedScores = Object.assign({}, existing.scores || {});
      Object.keys(quizData.scores || {}).forEach(function(groupNo) {
        mergedScores[groupNo] = Object.assign({}, mergedScores[groupNo] || {}, quizData.scores[groupNo] || {});
      });
      var mergedGroups = existing.groups || [];
      if (quizData.groups && quizData.groups.length > 0) {
        mergedGroups = quizData.groups.map(function(g) {
          var found = (existing.groups || []).find(function(eg) { return eg.no === g.no; });
          return g.name ? g : (found || g);
        });
      }
      rec.quizDataStandalone = Object.assign({}, existing, quizData, { scores: mergedScores, groups: mergedGroups });
    } else {
      // Yeni oturum — eski veriyi tamamen sil, yenisini yaz
      rec.quizDataStandalone = quizData;
    }

    jsonbinCacheDirty = true;
    var mergedScores = rec.quizDataStandalone.scores;
    res.json({ success: true, mergedScores: mergedScores });
    flushJsonbinCache().catch(function(e) { console.error('Quiz POST flush hatasi:', e.message); });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/quiz', async function(req, res) {
  if (jsonbinCache) {
    jsonbinCache.quizDataStandalone = null;
    jsonbinCacheDirty = true;
  }
  quizSlotLocks = {};
  try { await flushJsonbinCache(); } catch(e) { console.error('Quiz delete flush hatasi:', e.message); }
  res.json({ success: true });
});

app.post('/api/quiz/parse-answers', upload.single('file'), async function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    var ext = req.file.originalname.split('.').pop().toLowerCase();
    var text = '';
    if (ext === 'txt') {
      text = req.file.buffer.toString('utf-8');
    } else if (ext === 'docx') {
      var result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (ext === 'pdf') {
      text = await parsePdf(req.file.buffer);
    } else {
      return res.status(400).json({ error: 'Sadece .txt, .docx veya .pdf desteklenir' });
    }
    var answers = {};
    var lines = text.split(/\r?\n/);
    lines.forEach(function(line) {
      line = line.trim();
      if (!line) return;
      var m = line.match(/^(\d+)[\-\.\)\s]+(.+)$/);
      if (m) answers[parseInt(m[1])] = m[2].trim();
    });
    res.json({ answers: answers, count: Object.keys(answers).length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/quiz/parse-questions', upload.single('file'), async function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    var ext = req.file.originalname.split('.').pop().toLowerCase();
    var text = '';
    if (ext === 'txt') {
      text = req.file.buffer.toString('utf-8');
    } else if (ext === 'docx') {
      var result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (ext === 'pdf') {
      text = await parsePdf(req.file.buffer);
    } else {
      return res.status(400).json({ error: 'Sadece .txt, .docx veya .pdf desteklenir' });
    }
    var questions = {};
    var lines = text.split(/\r?\n/);
    var currentNo = null;
    var currentQuestion = '';
    var currentSection = '';
    var lastQuestionNo = 0;

    function isOptionLine(line) {
      var matches = line.match(/(?<!\d)\d+[-.)]\s*[^\d\s]/g);
      return matches && matches.length > 1;
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var ansMatch = line.match(/^[Cc]evap\s*:(.+)$/);
      if (ansMatch) {
        if (currentNo !== null && currentQuestion.trim()) {
          questions[currentNo] = { question: currentQuestion.trim(), answer: ansMatch[1].trim(), section: currentSection };
          currentNo = null;
          currentQuestion = '';
        }
        continue;
      }
      var qMatch = line.match(/^(\d+)[-.)]\s*(.+)$/);
      if (qMatch && !isOptionLine(line)) {
        var no = parseInt(qMatch[1]);
        if (no > lastQuestionNo) {
          if (currentNo !== null && currentQuestion.trim() && !questions[currentNo]) {
            questions[currentNo] = { question: currentQuestion.trim(), answer: '', section: currentSection };
          }
          currentNo = no;
          lastQuestionNo = no;
          currentQuestion = qMatch[2];
          continue;
        }
      }
      if (currentNo !== null) {
        currentQuestion += ' ' + line;
      } else {
        currentSection = line;
      }
    }
    if (currentNo !== null && currentQuestion.trim() && !questions[currentNo]) {
      questions[currentNo] = { question: currentQuestion.trim(), answer: '', section: currentSection };
    }
    res.json({ questions: questions, count: Object.keys(questions).length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Frontend ──────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('/{*path}', function(req, res) {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', function() {
  console.log('Quiz server ' + PORT + ' portunda calisiyor');
});