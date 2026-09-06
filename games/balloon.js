/* =========================================================
   ตัวอย่างไฟล์เกม ยิงลูกโป่ง
   ก๊อปไฟล์นี้ไปแก้เป็นเกมของคุณเองได้เลย

   วิธีใช้ สองทาง
   1. หน้าสำหรับครู กดอัปโหลดไฟล์เกม .js  เก็บในเครื่องนี้เครื่องเดียว
   2. เอาไฟล์ไปวางในโฟลเดอร์ games บน GitHub แล้วเพิ่มชื่อไฟล์ลงใน games.json
      แบบนี้ทุกเครื่องจะได้เกมนี้เหมือนกัน

   สิ่งที่แกนหลักจัดการให้แล้ว ไม่ต้องเขียนเอง
   กล้อง การอ่านมือและใบหน้า การสุ่มข้อ การสลับตัวเลือก
   เวลานับถอยหลัง คะแนน เสียง หน้าสรุปผล
   หน้าที่ของไฟล์เกมคือ วาดตัวเลือกและตัดสินใจว่าผู้เล่นเลือกข้อไหน
   ========================================================= */

(function () {

  /* ใส่สไตล์ของเกมนี้ครั้งเดียว */
  if (!document.getElementById('balloon-style')) {
    var st = document.createElement('style');
    st.id = 'balloon-style';
    st.textContent = [
      '.hq-balloon{--p:0;position:absolute;left:0;top:0;padding:18px 22px;border-radius:50% 50% 46% 46%;',
      '  min-width:150px;max-width:34vw;text-align:center;line-height:1.3;',
      '  font-size:clamp(16px,2.2vw,24px);color:#101736;font-weight:600;',
      '  background:#FBBF24;border:3px solid rgba(255,255,255,.55);',
      '  box-shadow:0 10px 26px rgba(7,11,28,.45);will-change:transform}',
      '.hq-balloon::after{content:"";position:absolute;left:50%;bottom:-14px;width:2px;height:14px;',
      '  background:rgba(255,255,255,.6)}',
      '.hq-balloon.c1{background:#22D3EE}.hq-balloon.c2{background:#34D399}',
      '.hq-balloon.c3{background:#FF6B5B}.hq-balloon.c0{background:#FBBF24}',
      '.hq-balloon .fill{position:absolute;inset:0;border-radius:inherit;',
      '  background:rgba(16,23,54,.45);transform:scaleY(var(--p));transform-origin:bottom}',
      '.hq-balloon.hot{border-color:#F2EFE6}'
    ].join('');
    document.head.appendChild(st);
  }

  HandQuiz.registerGame({
    /* ---------- ข้อมูลของเกม ---------- */
    id: 'balloon',                 // ห้ามซ้ำกับเกมอื่น
    name: 'ยิงลูกโป่ง',
    desc: 'ลูกโป่งลอยขึ้น ชี้ค้างที่ใบที่ถูก',
    tracker: 'hand',               // 'hand' ใช้การอ่านมือ หรือ 'face' ใช้ใบหน้า
    note: 'ลูกโป่งจะลอยขึ้นเรื่อย ๆ ชี้นิ้วไปที่ใบที่ตอบถูกแล้วค้างไว้จนเต็ม',

    /* ---------- เรียกครั้งเดียวตอนขึ้นข้อใหม่ ----------
       ctx.q         คำถามข้อนี้  { text, choices:[{text}], correct }
       ctx.layer     กล่องว่างสำหรับวางของ ล้างให้ทุกข้อแล้ว
       ctx.W, ctx.H  ขนาดจอเป็นพิกเซล
       ctx.letters   ['ก','ข','ค','ง']                                  */
    render: function (ctx) {
      var n = ctx.q.choices.length;
      var self = this;
      this.items = ctx.q.choices.map(function (c, i) {
        var el = HandQuiz.el('div', 'hq-balloon c' + (i % 4));
        var fill = HandQuiz.el('div', 'fill');
        el.appendChild(fill);
        el.appendChild(document.createTextNode(ctx.letters[i] + '  ' + (c.text || '')));
        ctx.layer.appendChild(el);
        return {
          el: el, i: i,
          x: (i + 0.5) / n * ctx.W,
          y: ctx.H + 120 + Math.random() * 260,
          sp: 42 + Math.random() * 26,          // ความเร็วลอยขึ้น พิกเซลต่อวินาที
          drift: (Math.random() - 0.5) * 18     // ส่ายซ้ายขวา
        };
      });
      this.t = 0;
    },

    /* ---------- เรียกทุกเฟรม ----------
       dt            เวลาที่ผ่านไปเป็นมิลลิวินาที
       ctx.input     { seen, x, y, grip, pinch, kind }
                     grip เป็น 'open' 'fist' 'ok' หรือ 'mid'
       ctx.hit(el)   จุดของผู้เล่นทับ el อยู่ไหม เผื่อขอบให้แล้ว
       ctx.dwell(k,on,dt)  นับเวลาค้าง คืนค่า 0 ถึง 1 ครบเมื่อได้ 1
       ctx.answer(i) ตอบข้อที่ i แกนหลักจะตรวจ ให้คะแนน แล้วไปข้อต่อไปเอง  */
    frame: function (ctx, dt) {
      this.t += dt;
      var self = this;
      this.items.forEach(function (b) {
        b.y -= b.sp * dt / 1000;
        if (b.y < -160) b.y = ctx.H + 140;      // ลอยพ้นจอแล้ววนกลับมาใหม่
        var wob = Math.sin((self.t + b.i * 700) / 900) * b.drift;
        b.el.style.transform = 'translate(' + (b.x + wob) + 'px,' + b.y + 'px) translate(-50%,-50%)';

        var over = ctx.hit(b.el);
        var p = ctx.dwell('b' + b.i, over, dt);
        b.el.classList.toggle('hot', over);
        b.el.style.setProperty('--p', over ? p.toFixed(3) : 0);

        // ถ้าอยากให้หยิกนิ้วแล้วตอบทันที ใช้บรรทัดนี้แทน
        // if (over && ctx.input.grip === 'ok') ctx.answer(b.i);
        if (p >= 1) ctx.answer(b.i);
      });
    },

    /* ---------- เรียกหลังตอบ จะใส่หรือไม่ใส่ก็ได้ ----------
       right บอกว่าตอบถูกไหม  i คือข้อที่ตอบ ถ้าหมดเวลาจะเป็น -1 */
    judged: function (ctx, i, right) {
      this.items.forEach(function (b) {
        if (b.i === ctx.q.correct) b.el.style.borderColor = '#34D399';
        else if (b.i === i) b.el.style.opacity = '.35';
      });
    },

    /* ---------- เรียกตอนออกจากเกม จะใส่หรือไม่ใส่ก็ได้ ---------- */
    stop: function (ctx) {
      this.items = [];
    }
  });

})();
