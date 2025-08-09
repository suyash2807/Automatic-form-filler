import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface AnalyzeFormRequest {
  url: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeFormRequest = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Use AI to analyze the form and predict what fields might be present
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Analyze this URL and provide insights about the form that might be present: ${url}

      Please provide:
      1. Likely form fields that would be present
      2. The type of form this appears to be (contact, registration, survey, etc.)
      3. Any special considerations for filling this form
      4. Confidence level (1-10) that this URL contains a fillable form

      Return your response as a JSON object with the following structure:
      {
        "formType": "contact form",
        "likelyFields": ["name", "email", "phone", "message"],
        "considerations": ["May require captcha", "Might have required fields"],
        "confidence": 8,
        "recommendations": ["Fill name field first", "Email validation likely present"]
      }`,
      maxTokens: 400,
    })

    try {
      const analysis = JSON.parse(text)
      return NextResponse.json({
        success: true,
        analysis,
      })
    } catch (parseError) {
      // If JSON parsing fails, return a basic analysis
      return NextResponse.json({
        success: true,
        analysis: {
          formType: "unknown",
          likelyFields: ["name", "email", "phone", "address"],
          considerations: ["Standard form fields expected"],
          confidence: 5,
          recommendations: ["Verify form fields before submission"],
        },
      })
    }
  } catch (error) {
    console.error("Error in form analysis API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
