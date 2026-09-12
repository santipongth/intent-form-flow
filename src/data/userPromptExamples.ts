export type Locale = "th" | "en";

export interface UserPromptExample {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  prompt: Record<Locale, string>;
}

export interface UserPromptCategory {
  id: string;
  name: Record<Locale, string>;
  examples: UserPromptExample[];
}

export const USER_PROMPT_CATEGORIES: UserPromptCategory[] = [
  {
    id: "knowledge",
    name: { th: "ตอบจากคลังความรู้", en: "Knowledge / Q&A" },
    examples: [
      {
        id: "knowledge-cited",
        title: { th: "ตอบพร้อมอ้างอิงเอกสาร", en: "Answer with citations" },
        description: {
          th: "บังคับให้ตอบจากเอกสารเท่านั้น พร้อมระบุแหล่งที่มา",
          en: "Answer only from uploaded documents and cite sources",
        },
        prompt: {
          th: "คำถามของผู้ใช้: {{question}}\n\nกติกาการตอบ:\n1. ค้นหาคำตอบจากเอกสารในคลังความรู้ก่อนเสมอ\n2. ตอบเป็นข้อ ๆ สั้น กระชับ ใช้ภาษาที่ผู้ใช้ถาม\n3. ใส่หมายเลขอ้างอิง [1] [2] ท้ายประโยคที่นำมาจากเอกสาร\n4. หากไม่พบข้อมูลในเอกสาร ให้บอกตรง ๆ ว่า \"ไม่พบข้อมูลนี้ในเอกสาร\" และเสนอคำถามที่ใกล้เคียง\n5. ปิดท้ายด้วยสรุป 1 บรรทัด",
          en: "User question: {{question}}\n\nRules:\n1. Always search the knowledge base first\n2. Answer in short bullet points, in the user's language\n3. Add reference markers [1] [2] after any sentence taken from a document\n4. If the answer is not in the documents, say so plainly and suggest a closer question\n5. End with a one-line summary",
        },
      },
      {
        id: "knowledge-policy",
        title: { th: "ตีความนโยบาย/ระเบียบ", en: "Policy interpretation" },
        description: { th: "อธิบายเงื่อนไขและข้อยกเว้นอย่างเป็นขั้นตอน", en: "Explain conditions and exceptions step by step" },
        prompt: {
          th: "คำถาม: {{question}}\n\nรูปแบบคำตอบ:\n- คำตอบสั้น (ใช่/ไม่ใช่/ขึ้นอยู่กับ)\n- เงื่อนไขที่เกี่ยวข้อง (อ้างอิงหัวข้อหรือหน้าในเอกสาร)\n- ข้อยกเว้นที่ควรรู้\n- ขั้นตอนถัดไปที่ผู้ใช้ควรทำ\n\nห้ามเดาเงื่อนไขที่ไม่มีในเอกสาร",
          en: "Question: {{question}}\n\nAnswer format:\n- Short answer (yes / no / it depends)\n- Relevant conditions (cite the document section or page)\n- Exceptions worth knowing\n- Next step for the user\n\nNever invent conditions that are not in the documents.",
        },
      },
    ],
  },
  {
    id: "support",
    name: { th: "บริการลูกค้า", en: "Customer support" },
    examples: [
      {
        id: "support-reply",
        title: { th: "ตอบลูกค้าอย่างสุภาพและชัดเจน", en: "Polite, clear customer reply" },
        description: { th: "โทนสุภาพ มีขั้นตอนแก้ปัญหา และการส่งต่อทีมงาน", en: "Warm tone, troubleshooting steps, escalation path" },
        prompt: {
          th: "ข้อความจากลูกค้า: {{question}}\n\nวิธีตอบ:\n1. ทักทายและสรุปปัญหาของลูกค้าใน 1 ประโยค เพื่อยืนยันความเข้าใจ\n2. ให้วิธีแก้ไขเป็นขั้นตอน 1-2-3 ที่ทำตามได้ทันที\n3. ถ้าต้องใช้ข้อมูลเพิ่ม (เลขคำสั่งซื้อ อีเมล) ให้ถามเพียง 1 อย่างที่จำเป็นที่สุด\n4. ถ้าเกินขอบเขต ให้แจ้งว่าจะส่งต่อทีมงานและระบุเวลาตอบกลับโดยประมาณ\n5. โทนสุภาพ เป็นกันเอง ไม่เกิน 150 คำ",
          en: "Customer message: {{question}}\n\nHow to reply:\n1. Greet and restate the issue in one sentence to confirm understanding\n2. Give 1-2-3 actionable steps\n3. If more info is needed (order id, email), ask only the single most important one\n4. If out of scope, say it will be escalated and give an expected response time\n5. Friendly, professional tone, under 150 words",
        },
      },
      {
        id: "support-refund",
        title: { th: "เคสคืนเงิน/เคลม", en: "Refund / claim case" },
        description: { th: "ตรวจเงื่อนไขก่อนตอบ และเสนอทางเลือก", en: "Check eligibility first, then offer options" },
        prompt: {
          th: "เคสจากลูกค้า: {{question}}\n\nให้ตอบตามลำดับ:\n- สรุปเคสและวันที่/สินค้าที่เกี่ยวข้อง\n- ตรวจเงื่อนไขการคืนเงินจากคลังความรู้ แล้วระบุว่า \"เข้าเงื่อนไข\" หรือ \"ไม่เข้าเงื่อนไข\" พร้อมเหตุผล\n- เสนอทางเลือก 2 ทาง (เช่น คืนเงิน / เปลี่ยนสินค้า)\n- ระบุเอกสารหรือข้อมูลที่ลูกค้าต้องส่งเพิ่ม\n\nห้ามให้สัญญาเรื่องเงินคืนหากไม่ตรงกับเงื่อนไขในเอกสาร",
          en: "Customer case: {{question}}\n\nRespond in this order:\n- Summarize the case with dates and product\n- Check refund conditions in the knowledge base, then state eligible / not eligible with reasons\n- Offer two options (e.g. refund / replacement)\n- List documents the customer must provide\n\nNever promise a refund that contradicts documented policy.",
        },
      },
    ],
  },
  {
    id: "research",
    name: { th: "ค้นคว้า & สรุปข่าว", en: "Research & news" },
    examples: [
      {
        id: "research-brief",
        title: { th: "สรุปข่าว/งานวิจัยเป็นบรีฟ", en: "Research brief" },
        description: { th: "ค้นเว็บ สรุปประเด็นหลัก และผลกระทบ", en: "Search the web, summarize key points and impact" },
        prompt: {
          th: "หัวข้อที่ต้องการ: {{question}}\n\nให้ใช้เครื่องมือค้นหาเว็บก่อน แล้วสรุปในรูปแบบนี้:\n1. สรุปภาพรวม 3 บรรทัด\n2. ประเด็นสำคัญ 3-5 ข้อ พร้อมวันที่และแหล่งที่มา (ชื่อเว็บ + ลิงก์)\n3. ผลกระทบต่อธุรกิจ/ผู้อ่าน\n4. สิ่งที่ยังไม่ชัดเจนหรือควรติดตามต่อ\n\nระบุเสมอว่าข้อมูลอัปเดตถึงวันที่เท่าใด และห้ามอ้างแหล่งที่ไม่ได้เปิดอ่านจริง",
          en: "Topic: {{question}}\n\nUse the web search tool first, then summarize:\n1. Three-line overview\n2. 3-5 key points with dates and sources (site name + link)\n3. Business or reader impact\n4. Open questions to watch\n\nAlways state the data cut-off date and never cite a source you did not actually open.",
        },
      },
      {
        id: "research-compare",
        title: { th: "เปรียบเทียบตัวเลือก", en: "Compare options" },
        description: { th: "ตารางเปรียบเทียบพร้อมข้อเสนอแนะ", en: "Comparison table plus a recommendation" },
        prompt: {
          th: "สิ่งที่ต้องเปรียบเทียบ: {{question}}\n\nรูปแบบคำตอบ:\n- ตารางเปรียบเทียบ (เกณฑ์ | ตัวเลือก A | ตัวเลือก B | ตัวเลือก C)\n- ข้อดี/ข้อเสียของแต่ละตัวเลือก อย่างละ 2 ข้อ\n- คำแนะนำสุดท้าย 1 ตัวเลือก พร้อมเหตุผลและกรณีที่ไม่ควรเลือก\n- อ้างอิงแหล่งข้อมูลทุกตัวเลข",
          en: "Compare: {{question}}\n\nFormat:\n- Comparison table (criteria | option A | option B | option C)\n- Two pros and two cons each\n- One final recommendation with reasoning and when not to pick it\n- Cite a source for every number",
        },
      },
    ],
  },
  {
    id: "analytics",
    name: { th: "วิเคราะห์ข้อมูล", en: "Data analysis" },
    examples: [
      {
        id: "analytics-insight",
        title: { th: "วิเคราะห์ไฟล์ Excel/CSV", en: "Analyze Excel / CSV" },
        description: { th: "อ่านไฟล์ หาแนวโน้ม และเสนอสิ่งที่ควรทำต่อ", en: "Read the file, find trends, recommend actions" },
        prompt: {
          th: "คำถามเชิงธุรกิจ: {{question}}\n\nขั้นตอน:\n1. อ่านไฟล์ข้อมูลด้วยเครื่องมือที่มี และระบุจำนวนแถว/คอลัมน์ที่ใช้\n2. คำนวณตัวเลขด้วยเครื่องมือคำนวณเท่านั้น ห้ามประมาณเอง\n3. รายงานผล: ตัวเลขหลัก 3 ตัว, แนวโน้มที่พบ, ความผิดปกติ (outlier)\n4. ข้อเสนอแนะที่ทำได้จริง 3 ข้อ เรียงตามผลกระทบ\n5. ระบุข้อจำกัดของข้อมูล เช่น ข้อมูลขาดหาย ช่วงเวลาไม่ครบ",
          en: "Business question: {{question}}\n\nSteps:\n1. Read the data file with the available tool and state rows/columns used\n2. Compute every number with the calculator tool, never estimate\n3. Report: three headline numbers, trends, outliers\n4. Three actionable recommendations ordered by impact\n5. State data limitations such as missing values or partial periods",
        },
      },
    ],
  },
  {
    id: "content",
    name: { th: "เขียนคอนเทนต์ & การตลาด", en: "Content & marketing" },
    examples: [
      {
        id: "content-seo",
        title: { th: "บทความ SEO", en: "SEO article" },
        description: { th: "โครงสร้างหัวข้อ คีย์เวิร์ด และ meta", en: "Heading structure, keywords, meta description" },
        prompt: {
          th: "หัวข้อบทความ: {{question}}\n\nสิ่งที่ต้องส่งมอบ:\n1. ชื่อเรื่อง 3 แบบ (ไม่เกิน 60 ตัวอักษร)\n2. Meta description (ไม่เกิน 155 ตัวอักษร)\n3. โครงบทความ H2/H3 พร้อมสาระสำคัญของแต่ละหัวข้อ\n4. เนื้อหาเต็มโทนเป็นกันเองแต่น่าเชื่อถือ ย่อหน้าละไม่เกิน 4 บรรทัด\n5. คำถามพบบ่อย 3 ข้อพร้อมคำตอบสั้น\n\nแทรกคีย์เวิร์ดหลักอย่างเป็นธรรมชาติ ห้ามยัดคีย์เวิร์ด และห้างสร้างสถิติที่ไม่มีแหล่งอ้างอิง",
          en: "Article topic: {{question}}\n\nDeliverables:\n1. Three title options (max 60 characters)\n2. Meta description (max 155 characters)\n3. H2/H3 outline with the key idea per section\n4. Full draft, friendly but credible, paragraphs under four lines\n5. Three FAQs with short answers\n\nUse the main keyword naturally, never keyword-stuff, and never invent statistics without a source.",
        },
      },
      {
        id: "content-social",
        title: { th: "โพสต์โซเชียล 3 แพลตฟอร์ม", en: "Social posts, three platforms" },
        description: { th: "ปรับความยาวและโทนให้เหมาะแต่ละแพลตฟอร์ม", en: "Adapt length and tone per platform" },
        prompt: {
          th: "เนื้อหา/แคมเปญ: {{question}}\n\nเขียนให้ 3 แบบ:\n- Facebook: 80-120 คำ เล่าเรื่อง มี CTA ชัดเจน\n- X/Twitter: ไม่เกิน 240 ตัวอักษร กระชับ มีมุมที่ทำให้อยากคลิก\n- LinkedIn: 120-180 คำ โทนมืออาชีพ เน้นข้อมูลและบทเรียน\n\nทุกแบบ: เพิ่มแฮชแท็กที่เกี่ยวข้อง 3 ตัว และอีโมจิไม่เกิน 2 ตัว",
          en: "Content / campaign: {{question}}\n\nWrite three versions:\n- Facebook: 80-120 words, story-led, clear CTA\n- X/Twitter: under 240 characters, sharp hook\n- LinkedIn: 120-180 words, professional, insight-led\n\nEach: three relevant hashtags and at most two emojis.",
        },
      },
    ],
  },
  {
    id: "dev",
    name: { th: "โปรแกรมมิ่ง & รีวิวโค้ด", en: "Engineering & code review" },
    examples: [
      {
        id: "dev-review",
        title: { th: "รีวิวโค้ดแบบมีลำดับความสำคัญ", en: "Prioritized code review" },
        description: { th: "แยกบั๊ก ความปลอดภัย และคุณภาพโค้ด", en: "Separate bugs, security and code quality" },
        prompt: {
          th: "โค้ด/คำถาม: {{question}}\n\nรีวิวตามลำดับนี้:\n1. บั๊กที่ทำให้ระบบพัง (Critical) พร้อมโค้ดตัวอย่างที่แก้แล้ว\n2. ช่องโหว่ด้านความปลอดภัย เช่น input validation, สิทธิ์การเข้าถึง, ข้อมูลลับรั่ว\n3. ประสิทธิภาพและความซับซ้อนที่ควรลด\n4. ความอ่านง่าย/ตั้งชื่อ/เทสต์ที่ควรเพิ่ม\n\nแต่ละข้อระบุระดับความสำคัญ (สูง/กลาง/ต่ำ) และเหตุผลสั้น ๆ ถ้าโค้ดดีอยู่แล้วให้บอกตรง ๆ ว่าไม่มีประเด็น",
          en: "Code / question: {{question}}\n\nReview in this order:\n1. Breaking bugs (critical) with a corrected snippet\n2. Security issues: input validation, access control, secret leakage\n3. Performance and complexity\n4. Readability, naming, missing tests\n\nTag each finding high / medium / low with a short reason. If the code is fine, say so plainly.",
        },
      },
      {
        id: "dev-debug",
        title: { th: "ช่วยดีบักจาก error log", en: "Debug from an error log" },
        description: { th: "ตั้งสมมติฐานและวิธีตรวจสอบทีละขั้น", en: "Hypotheses and step-by-step checks" },
        prompt: {
          th: "อาการ/ข้อความ error: {{question}}\n\nตอบแบบนี้:\n1. อธิบายว่า error นี้แปลว่าอะไรด้วยภาษาง่าย ๆ\n2. สาเหตุที่เป็นไปได้ 3 ข้อ เรียงจากน่าจะเป็นที่สุด\n3. วิธีตรวจสอบแต่ละสาเหตุ (คำสั่งหรือจุดที่ต้องดู)\n4. วิธีแก้ที่แนะนำพร้อมโค้ด\n5. วิธีป้องกันไม่ให้เกิดซ้ำ",
          en: "Symptom / error: {{question}}\n\nRespond with:\n1. Plain-language explanation of the error\n2. Three likely causes, most likely first\n3. How to verify each cause (command or place to look)\n4. Recommended fix with code\n5. How to prevent a recurrence",
        },
      },
    ],
  },
  {
    id: "productivity",
    name: { th: "สรุปประชุม & งานประจำวัน", en: "Meetings & productivity" },
    examples: [
      {
        id: "productivity-meeting",
        title: { th: "สรุปประชุมเป็น action items", en: "Meeting notes to action items" },
        description: { th: "สรุปการตัดสินใจ ผู้รับผิดชอบ และกำหนดส่ง", en: "Decisions, owners and due dates" },
        prompt: {
          th: "บันทึก/ถอดเทปการประชุม: {{question}}\n\nสรุปให้:\n1. สาระสำคัญ 5 ข้อ\n2. การตัดสินใจที่เกิดขึ้น (พร้อมเหตุผล)\n3. ตาราง Action items: งาน | ผู้รับผิดชอบ | กำหนดส่ง\n4. ประเด็นค้างที่ยังไม่ได้ข้อสรุป\n5. ร่างอีเมลติดตามงานสั้น ๆ\n\nถ้าไม่มีผู้รับผิดชอบหรือกำหนดส่งในบันทึก ให้ใส่ \"ยังไม่ระบุ\" ห้ามเดา",
          en: "Meeting notes / transcript: {{question}}\n\nProduce:\n1. Five key points\n2. Decisions made, with reasoning\n3. Action item table: task | owner | due date\n4. Open items\n5. A short follow-up email draft\n\nIf an owner or due date is missing, write \"not specified\" — never guess.",
        },
      },
      {
        id: "productivity-email",
        title: { th: "ร่างอีเมลตอบกลับ", en: "Draft an email reply" },
        description: { th: "สองโทน: ทางการและเป็นกันเอง", en: "Two tones: formal and casual" },
        prompt: {
          th: "อีเมลต้นฉบับ/สิ่งที่ต้องการสื่อ: {{question}}\n\nร่างให้ 2 แบบ:\n- แบบทางการ (ใช้กับลูกค้าองค์กร)\n- แบบเป็นกันเอง (ใช้กับทีมภายใน)\n\nแต่ละแบบต้องมี: หัวข้ออีเมล, เนื้อหาไม่เกิน 120 คำ, ขั้นตอนถัดไปที่ชัดเจน และปิดท้ายด้วยคำถามให้ผู้รับตอบง่าย",
          en: "Original email / intent: {{question}}\n\nDraft two versions:\n- Formal (enterprise customer)\n- Casual (internal team)\n\nEach: subject line, body under 120 words, a clear next step, and a closing question that is easy to answer.",
        },
      },
    ],
  },
  {
    id: "sales",
    name: { th: "การขาย & คัดกรองลูกค้า", en: "Sales & qualification" },
    examples: [
      {
        id: "sales-qualify",
        title: { th: "คัดกรองลูกค้าเบื้องต้น", en: "Qualify a lead" },
        description: { th: "เก็บข้อมูลสำคัญและเสนอแพ็กเกจที่เหมาะ", en: "Capture key info and recommend a plan" },
        prompt: {
          th: "ข้อความจากผู้สนใจ: {{question}}\n\nสิ่งที่ต้องทำ:\n1. ตอบคำถามที่ถามมาก่อน โดยใช้ข้อมูลสินค้าจากคลังความรู้\n2. ถามข้อมูลเพิ่มทีละ 1 คำถาม ตามลำดับ: ปัญหาที่ต้องการแก้ → ขนาดทีม/ปริมาณการใช้ → กรอบงบประมาณ → ช่วงเวลาที่ต้องการเริ่ม\n3. เมื่อได้ข้อมูลครบ ให้แนะนำแพ็กเกจที่เหมาะที่สุด พร้อมเหตุผลและราคาตามเอกสาร\n4. ปิดท้ายด้วยการเสนอนัดคุยหรือขั้นตอนถัดไป\n\nห้ามให้ส่วนลดหรือราคาที่ไม่มีในเอกสาร",
          en: "Prospect message: {{question}}\n\nDo this:\n1. Answer their question first, using product info from the knowledge base\n2. Ask one follow-up at a time: problem → team size / volume → budget range → timeline\n3. Once qualified, recommend the best plan with reasoning and documented pricing\n4. Close by proposing a call or a next step\n\nNever offer discounts or prices that are not documented.",
        },
      },
    ],
  },
];

/**
 * ตัวอย่าง "คำตอบจริง" ของแต่ละตัวอย่าง prompt (key = example id)
 * ใช้แสดงในหน้าตั้งค่าขั้นสูง เพื่อให้ผู้ใช้เห็นว่า Agent จะตอบออกมาหน้าตาแบบไหน
 */
export const USER_PROMPT_SAMPLE_ANSWERS: Record<string, Record<Locale, string>> = {
  "knowledge-cited": {
    th: `คำถาม: ลาพักร้อนสะสมข้ามปีได้กี่วัน

- พนักงานประจำสะสมวันลาพักร้อนข้ามปีได้สูงสุด 5 วัน [1]
- วันที่เหลือเกิน 5 วันจะถูกตัดทิ้งในวันที่ 31 ธันวาคม [1]
- ต้องใช้วันสะสมให้หมดภายในไตรมาส 1 ของปีถัดไป [2]

สรุป: สะสมได้ 5 วัน และต้องใช้ให้หมดก่อน 31 มีนาคมของปีถัดไป`,
    en: `Question: how many vacation days carry over?

- Full-time staff may carry over up to 5 days [1]
- Anything above 5 days is forfeited on 31 December [1]
- Carried-over days must be used within Q1 of the next year [2]

Summary: 5 days carry over and must be used before 31 March.`,
  },
  "support-reply": {
    th: `สวัสดีค่ะ เข้าใจว่าคุณเข้าสู่ระบบแล้วระบบแจ้งรหัสผ่านไม่ถูกต้องใช่ไหมคะ

1. กด "ลืมรหัสผ่าน" ที่หน้าเข้าสู่ระบบ แล้วกรอกอีเมลที่สมัครไว้
2. เปิดลิงก์ในอีเมลภายใน 60 นาที แล้วตั้งรหัสใหม่อย่างน้อย 8 ตัวอักษร
3. หากไม่พบอีเมล กรุณาตรวจในกล่อง Junk/Spam

รบกวนแจ้งอีเมลที่ใช้สมัครด้วยนะคะ หากยังเข้าไม่ได้ ทีมงานจะตรวจสอบให้ภายใน 1 วันทำการค่ะ`,
    en: `Hi! I understand your login is failing with an incorrect-password error.

1. Click "Forgot password" on the sign-in page and enter your registered email
2. Open the link within 60 minutes and set a new password of at least 8 characters
3. If the email is missing, check your Junk/Spam folder

Could you share the email you signed up with? If it still fails, our team will look into it within 1 business day.`,
  },
  "research-brief": {
    th: `หัวข้อ: แนวโน้มตลาด AI Agent องค์กรปี 2026

1. ภาพรวม: องค์กรย้ายจาก chatbot มาสู่ agent ที่เรียกเครื่องมือได้จริง งบส่วนใหญ่ไปที่ระบบค้นข้อมูลภายใน และเริ่มมีมาตรฐานการกำกับดูแลชัดขึ้น

2. ประเด็นสำคัญ
- 62% ขององค์กรที่สำรวจมี agent ใช้งานจริงอย่างน้อย 1 ตัว (ที่มา: รายงานผู้ให้บริการคลาวด์, มี.ค. 2026)
- ค่าใช้จ่ายต่อคำตอบลดลงราว 40% จากปีก่อน
- ปัญหาที่พบมากที่สุดคือคุณภาพข้อมูลภายใน ไม่ใช่ตัวโมเดล

3. ผลกระทบ: ทีมที่จัดระเบียบเอกสารก่อนจะได้ผลลัพธ์เร็วกว่า
4. ที่ยังไม่ชัดเจน: มาตรฐานการตรวจสอบย้อนกลับของ agent ข้ามระบบ

ข้อมูลอัปเดตถึง มี.ค. 2026`,
    en: `Topic: enterprise AI agent trends, 2026

1. Overview: companies are moving from chatbots to tool-using agents; most budget goes to internal retrieval, and governance standards are firming up.

2. Key points
- 62% of surveyed enterprises run at least one production agent (cloud vendor report, Mar 2026)
- Cost per answer down roughly 40% year over year
- The top blocker is internal data quality, not the model

3. Impact: teams that clean up documents first ship faster
4. Open question: cross-system agent audit standards

Data current to March 2026.`,
  },
  "analytics-insight": {
    th: `ไฟล์: sales_2026H1.xlsx (1,842 แถว, 9 คอลัมน์)

ตัวเลขหลัก
- ยอดขายรวม 12,480,500 บาท
- ค่าเฉลี่ยต่อออเดอร์ 6,764 บาท
- อัตราเติบโตเทียบครึ่งปีก่อน +18.4%

แนวโน้ม: ยอดขายภาคเหนือโตต่อเนื่อง 4 เดือนติด ขณะที่ภาคใต้ลดลง 7%
ความผิดปกติ: มี 3 ออเดอร์มูลค่าเกิน 400,000 บาท ดันค่าเฉลี่ยเดือน พ.ค. สูงผิดปกติ

ข้อเสนอแนะ
1. เพิ่มสต็อกสินค้ากลุ่ม A ในภาคเหนือก่อนไตรมาส 3
2. ตรวจสอบสาเหตุยอดตกของภาคใต้รายตัวแทนจำหน่าย
3. แยกรายงานลูกค้าองค์กรออกจากลูกค้าทั่วไป

ข้อจำกัด: ข้อมูลเดือน มิ.ย. ขาด 2 วันทำการ`,
    en: `File: sales_2026H1.xlsx (1,842 rows, 9 columns)

Headline numbers
- Total revenue 12,480,500 THB
- Average order value 6,764 THB
- Growth vs previous half: +18.4%

Trend: the North region grew four months straight; the South declined 7%.
Outlier: three orders above 400,000 THB inflate the May average.

Recommendations
1. Increase category A stock in the North before Q3
2. Investigate the Southern decline per reseller
3. Report enterprise and retail customers separately

Limitation: June is missing two business days.`,
  },
  "content-seo": {
    th: `ชื่อเรื่อง
1. AI Agent สำหรับธุรกิจ SME: เริ่มต้นอย่างไรให้คุ้ม
2. คู่มือสร้าง AI Agent ใช้งานจริงใน 1 สัปดาห์
3. AI Agent คืออะไร และธุรกิจไทยใช้ทำอะไรได้บ้าง

Meta description: รวมวิธีเริ่มต้นใช้ AI Agent ในธุรกิจ SME ตั้งแต่เลือกงานที่เหมาะ เตรียมข้อมูล ไปจนถึงวัดผลจริง

โครงบทความ
H2 AI Agent ต่างจากแชตบอตอย่างไร — เน้นการเรียกเครื่องมือและการทำงานหลายขั้น
H2 งานแรกที่ควรให้ AI Agent ทำ — งานซ้ำ ปริมาณมาก ความเสี่ยงต่ำ
H3 ตัวอย่าง 3 เคสจากธุรกิจจริง
H2 เตรียมข้อมูลอย่างไรให้ตอบแม่น
H2 วัดผลและควบคุมค่าใช้จ่าย

FAQ: ต้องมีทีมไอทีไหม / ใช้เวลานานแค่ไหน / ข้อมูลบริษัทปลอดภัยหรือไม่`,
    en: `Titles
1. AI Agents for SMEs: Where to Start
2. Build a Working AI Agent in One Week
3. What Is an AI Agent, and What Can It Actually Do?

Meta description: A practical guide to adopting AI agents in a small business — picking the right task, preparing data, and measuring results.

Outline
H2 How an agent differs from a chatbot — tool use and multi-step work
H2 The first job to hand an agent — repetitive, high volume, low risk
H3 Three real-world cases
H2 Preparing data for accurate answers
H2 Measuring results and controlling cost

FAQ: Do I need an IT team? / How long does it take? / Is company data safe?`,
  },
  "dev-review": {
    th: `1. บั๊กระดับ Critical (สูง)
ฟังก์ชัน getUser() ไม่ตรวจค่า null ก่อนอ่าน .id ทำให้ล่มเมื่อ session หมดอายุ
แก้เป็น: if (!user) return null; ก่อนบรรทัดที่อ่าน user.id

2. ความปลอดภัย (สูง)
รับ query string ไปต่อเป็นเงื่อนไขค้นหาโดยตรง ควร validate ด้วย schema และจำกัดความยาว 200 ตัวอักษร

3. ประสิทธิภาพ (กลาง)
เรียก API ในลูป 50 รอบ ควรรวมเป็น batch เดียว ลดเวลาจาก ~5s เหลือ ~0.4s

4. คุณภาพโค้ด (ต่ำ)
ตั้งชื่อ data1/data2 ไม่สื่อความหมาย และยังไม่มีเทสต์กรณี session หมดอายุ`,
    en: `1. Critical bug (high)
getUser() reads .id without a null check and crashes on an expired session.
Fix: return null early when user is falsy.

2. Security (high)
The raw query string is concatenated into the search filter. Validate with a schema and cap it at 200 characters.

3. Performance (medium)
An API call inside a 50-iteration loop; batch it into one request (~5s to ~0.4s).

4. Code quality (low)
data1/data2 are meaningless names, and there is no test for the expired-session path.`,
  },
  "productivity-meeting": {
    th: `สาระสำคัญ
1. เลื่อนเปิดตัวฟีเจอร์รายงานเป็นวันที่ 30 ก.ย.
2. ลูกค้าองค์กร 2 รายขอ SSO
3. งบโฆษณาไตรมาส 4 คงเดิม

การตัดสินใจ: เลื่อนเปิดตัว เพราะการทดสอบโหลดยังไม่ผ่านเกณฑ์

Action items
| งาน | ผู้รับผิดชอบ | กำหนดส่ง |
| ทดสอบโหลดรอบใหม่ | ต้น | 18 ก.ย. |
| ร่างข้อเสนอ SSO | ฝ้าย | 22 ก.ย. |
| อัปเดตลูกค้า 2 ราย | ยังไม่ระบุ | 19 ก.ย. |

ประเด็นค้าง: ราคาแพ็กเกจ SSO ยังไม่สรุป`,
    en: `Key points
1. Reporting feature launch moved to 30 Sep
2. Two enterprise customers requested SSO
3. Q4 ad budget unchanged

Decision: delay the launch because load testing has not passed.

Action items
| Task | Owner | Due |
| Re-run load tests | Ton | 18 Sep |
| Draft SSO proposal | Fai | 22 Sep |
| Update the two customers | not specified | 19 Sep |

Open item: SSO package pricing is undecided.`,
  },
  "sales-qualify": {
    th: `ขอบคุณที่สนใจครับ แพ็กเกจ Pro รองรับผู้ใช้ 20 คน และมี API ให้เชื่อมระบบภายในได้ครับ

ขออนุญาตถาม 1 ข้อก่อนนะครับ: ตอนนี้งานหลักที่อยากให้ระบบช่วยคืองานอะไรครับ (เช่น ตอบลูกค้า สรุปเอกสาร หรือค้นข้อมูลภายใน)

เมื่อทราบแล้ว ผมจะแนะนำแพ็กเกจที่คุ้มที่สุดพร้อมราคาตามเอกสารให้ครับ`,
    en: `Thanks for reaching out! The Pro plan covers 20 seats and includes API access for internal systems.

One question first: what is the main job you want the system to handle — customer replies, document summaries, or internal search?

Once I know that, I will recommend the best-value plan with documented pricing.`,
  },
  "finance-summary": {
    th: `สรุปงบประมาณ ไตรมาส 2/2026

ภาพรวม
- งบที่ตั้งไว้ 4,500,000 บาท ใช้จริง 4,118,300 บาท คงเหลือ 381,700 บาท (คิดเป็น 8.5%)
- หมวดที่ใช้เกินงบ: การตลาด +212,000 บาท (+14%)
- หมวดที่ใช้ต่ำกว่างบ: จัดจ้างภายนอก -430,000 บาท (-27%)

สาเหตุหลัก
1. ค่าโฆษณาเดือน พ.ค. สูงกว่าแผนจากแคมเปญเปิดตัวสินค้า
2. โครงการจ้างภายนอก 1 โครงการเลื่อนไปไตรมาส 3

สิ่งที่ควรทำต่อ
1. ย้ายงบคงเหลือจากหมวดจัดจ้าง 200,000 บาท ไปชดเชยหมวดการตลาด
2. ตั้งเพดานค่าโฆษณารายเดือนไว้ที่ 550,000 บาท
3. ทบทวนแผนไตรมาส 3 ให้รวมโครงการที่เลื่อนมา

ข้อจำกัด: ยังไม่รวมใบแจ้งหนี้ที่ยังไม่บันทึก 2 ใบ`,
    en: `Budget summary — Q2 2026

Overview
- Budget 4,500,000 THB, actual 4,118,300 THB, remaining 381,700 THB (8.5%)
- Over budget: Marketing +212,000 THB (+14%)
- Under budget: Outsourcing -430,000 THB (-27%)

Main drivers
1. May ad spend exceeded plan due to the product launch campaign
2. One outsourced project slipped to Q3

Next steps
1. Reallocate 200,000 THB from outsourcing to marketing
2. Cap monthly ad spend at 550,000 THB
3. Rebuild the Q3 plan to include the deferred project

Limitation: two unposted invoices are not included.`,
  },
  "finance-variance": {
    th: `เปรียบเทียบแผนกับผลจริง เดือนสิงหาคม

| รายการ | แผน | จริง | ผลต่าง |
| รายได้ | 2,000,000 | 2,180,000 | +180,000 (+9%) |
| ต้นทุนขาย | 900,000 | 1,020,000 | +120,000 (+13%) |
| ค่าใช้จ่ายดำเนินงาน | 620,000 | 588,000 | -32,000 (-5%) |
| กำไรสุทธิ | 480,000 | 572,000 | +92,000 (+19%) |

อธิบายผลต่างสำคัญ
- รายได้สูงกว่าแผนจากคำสั่งซื้อลูกค้าองค์กร 2 ราย
- ต้นทุนขายสูงขึ้นตามปริมาณ และมีค่าขนส่งเร่งด่วน 46,000 บาท

ความเสี่ยงเดือนถัดไป: หากคำสั่งซื้อพิเศษไม่เกิดซ้ำ กำไรจะกลับมาใกล้แผนเดิม`,
    en: `Plan vs actual — August

| Line | Plan | Actual | Variance |
| Revenue | 2,000,000 | 2,180,000 | +180,000 (+9%) |
| COGS | 900,000 | 1,020,000 | +120,000 (+13%) |
| OpEx | 620,000 | 588,000 | -32,000 (-5%) |
| Net profit | 480,000 | 572,000 | +92,000 (+19%) |

Key drivers
- Revenue beat plan on two enterprise orders
- COGS rose with volume plus 46,000 THB of expedited freight

Next-month risk: without repeat special orders, profit returns close to plan.`,
  },
  "transform-table": {
    th: `ข้อมูลนำเข้า 12 แถว แปลงสำเร็จ 11 แถว ข้าม 1 แถว

ผลลัพธ์ (CSV)
order_id,customer_name,order_date,amount_thb
A-1001,บริษัท เอ จำกัด,2026-08-01,12500.00
A-1002,ร้านบีสโตร์,2026-08-03,4800.50
A-1003,คุณสมชาย ใจดี,2026-08-04,990.00

การแปลงที่ทำ
- วันที่: แปลง 01/08/2026 และ 1 ส.ค. 69 เป็นรูปแบบ YYYY-MM-DD
- จำนวนเงิน: ตัดสัญลักษณ์ ฿ และคอมมา ใช้ทศนิยม 2 ตำแหน่ง
- ชื่อ: ตัดช่องว่างหน้า-หลัง

แถวที่ข้าม
- แถวที่ 7: ไม่มี order_id (ต้องการข้อมูลเพิ่มก่อนแปลง)`,
    en: `12 input rows — 11 converted, 1 skipped

Output (CSV)
order_id,customer_name,order_date,amount_thb
A-1001,Company A Ltd,2026-08-01,12500.00
A-1002,Bee Store,2026-08-03,4800.50
A-1003,Somchai Jaidee,2026-08-04,990.00

Transformations applied
- Dates: 01/08/2026 and "1 Aug 69" normalized to YYYY-MM-DD
- Amounts: stripped ฿ and commas, fixed to 2 decimals
- Names: trimmed whitespace

Skipped
- Row 7: missing order_id (needs clarification before conversion)`,
  },
  "transform-extract": {
    th: `สกัดข้อมูลจากอีเมล 1 ฉบับ

{
  "company": "บริษัท ทองดี จำกัด",
  "contact_name": "คุณมาลี",
  "email": "malee@thongdee.co.th",
  "phone": "02-123-4567",
  "request": "ขอใบเสนอราคาแพ็กเกจ 30 ผู้ใช้",
  "deadline": "2026-09-20",
  "budget_thb": null
}

หมายเหตุ
- budget_thb เป็น null เพราะอีเมลไม่ได้ระบุงบประมาณ (ไม่เดาค่า)
- เบอร์โทรจัดรูปแบบเป็นมาตรฐานเดียวกันแล้ว`,
    en: `Extracted from one email

{
  "company": "Thongdee Co., Ltd.",
  "contact_name": "Malee",
  "email": "malee@thongdee.co.th",
  "phone": "02-123-4567",
  "request": "Quote for a 30-seat package",
  "deadline": "2026-09-20",
  "budget_thb": null
}

Notes
- budget_thb is null because the email gives no budget (never guessed)
- The phone number was normalized to a single format`,
  },
};
