import OpenAI, { toFile } from 'openai';

const client = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

const ISSUE_LABELS: Record<string, string> = {
  leak: 'גילוי נזילה',
  waterproofing: 'איטום',
  pipe: 'בעיית צנרת',
  roof: 'נזק גג',
  moisture: 'עובש ולחות',
  other: 'בדיקת בנייה',
};

export interface CleanReportResult {
  professionalText: string;
  recommendations: Array<{
    priority: string;
    title: string;
    description: string;
  }>;
}

export async function cleanReportText(
  rawText: string,
  issueType: string,
): Promise<CleanReportResult> {
  const issueLabel = ISSUE_LABELS[issueType] ?? issueType;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.25,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `אתה מומחה בניסוח דוחות מקצועיים עבור אנשי מקצוע ישראלים בתחום ${issueLabel}.

קיבלת טקסט גולמי שהטכנאי אמר בשטח. עבד אותו לדוח מקצועי בעברית.

כללים חובה:
1. אל תמציא כל עובדה שלא הוזכרה במפורש בטקסט המקורי.
2. שמור על כל הפרטים שצוינו — מיקום, מידות, תצפיות.
3. שפר ניסוח לשפה מקצועית, ברורה ומדויקת.
4. בנה ממצאים בסדר לוגי: תיאור → מיקום → חומרה → סיבה אפשרית.
5. המלצות — מעשיות בלבד, מבוססות על הממצאים. עד 4 המלצות.
6. עדיפויות מותרות: "מיידי" | "תוך 48 שעות" | "עד שבועיים".

החזר JSON בפורמט המדויק הזה:
{
  "professionalText": "תיאור מקצועי של הממצאים בשני-שלושה משפטים",
  "recommendations": [
    {
      "priority": "מיידי",
      "title": "כותרת קצרה לפעולה",
      "description": "תיאור מפורט של הפעולה הנדרשת"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `טקסט גולמי מהטכנאי:\n${rawText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content) as {
    professionalText?: unknown;
    recommendations?: unknown;
  };

  if (typeof parsed.professionalText !== 'string') {
    throw new Error('Invalid response shape from OpenAI');
  }
  if (!Array.isArray(parsed.recommendations)) {
    throw new Error('Invalid recommendations shape from OpenAI');
  }

  return {
    professionalText: parsed.professionalText,
    recommendations: parsed.recommendations as CleanReportResult['recommendations'],
  };
}

export async function transcribeAudio(base64Audio: string): Promise<string> {
  const buffer = Buffer.from(base64Audio, 'base64');
  const file = await toFile(buffer, 'recording.m4a', { type: 'audio/mp4' });
  const result = await client.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'he',
  });
  return result.text;
}
