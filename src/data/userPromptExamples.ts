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
