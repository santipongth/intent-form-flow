

# Widget Language Support (Thai / English)

## Overview
Add a language selector in the embed settings so widget text (placeholder, error messages, status) adapts to Thai or English. A new `lang` URL parameter controls the widget's UI language.

## Changes

### 1. `src/pages/AgentDetail.tsx`
- Add state: `const [widgetLang, setWidgetLang] = useState<"th" | "en">("th")`
- Add a language toggle (two buttons like the position selector) in the embed customization grid with label "🌐 ภาษา Widget"
- Append `&lang=${widgetLang}` to `scriptEmbedCode`, `iframeEmbedCode`, and the preview iframe `src`

### 2. `supabase/functions/widget/index.ts`
- Read `lang` param: `const lang = url.searchParams.get("lang") || "th"`
- Define a translations map:

```text
th:
  placeholder: "พิมพ์ข้อความ..."
  online: "● ออนไลน์"
  defaultWelcome: "สวัสดีค่ะ! 👋 มีอะไรให้ช่วยไหมคะ?"
  errorGeneric: "เกิดข้อผิดพลาด"
  errorConnection: "เกิดข้อผิดพลาดในการเชื่อมต่อ"
  noResponse: "ไม่ได้รับคำตอบ กรุณาลองใหม่อีกครั้ง"

en:
  placeholder: "Type a message..."
  online: "● Online"
  defaultWelcome: "Hello! 👋 How can I help you?"
  errorGeneric: "An error occurred"
  errorConnection: "Connection error"
  noResponse: "No response received. Please try again."
```

- Pass `lang` through in bubble mode iframe src
- Replace all hardcoded Thai strings in the HTML template with the corresponding translation variable
- The `welcome_message` custom field still takes priority over the default welcome text

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AgentDetail.tsx` | Add `widgetLang` state, language toggle UI, append `lang` param to all embed URLs |
| `supabase/functions/widget/index.ts` | Read `lang` param, define i18n map, replace all hardcoded strings with translated values |

