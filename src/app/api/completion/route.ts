type CompletionOption = 'continue' | 'improve' | 'shorter' | 'longer' | 'zap'

function buildPrompt(
  text: string,
  option: CompletionOption = 'continue',
  command?: string,
): string {
  switch (option) {
    case 'continue':
      return `Continue writing the following text. Output only the continuation — do not repeat the original text.\n\n${text}`
    case 'improve':
      return `Rewrite the following text to improve clarity and quality. Output only the rewritten text.\n\n${text}`
    case 'shorter':
      return `Make the following text shorter while keeping the meaning. Output only the shortened text.\n\n${text}`
    case 'longer':
      return `Expand the following text with more detail. Output only the expanded text.\n\n${text}`
    case 'zap':
      return `${command?.trim() || 'Edit the following text as requested.'}\n\n${text}`
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response('OPENAI_API_KEY not configured', { status: 503 })
  }

  const body = await req.json()
  const prompt = body.prompt as string | undefined
  const option = (body.option as CompletionOption | undefined) ?? 'continue'
  const command = body.command as string | undefined

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'user',
          content: buildPrompt(prompt ?? '', option, command),
        },
      ],
    }),
  })

  if (!res.ok || !res.body) {
    let message = 'OpenAI request failed'
    try {
      const errorBody = await res.json()
      message =
        errorBody?.error?.message ??
        errorBody?.error?.code ??
        message
    } catch {
      /* ignore parse errors */
    }
    return new Response(message, { status: res.status === 429 ? 429 : 502 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const text = json.choices?.[0]?.delta?.content
            if (text) {
              controller.enqueue(
                encoder.encode(`0:${JSON.stringify(text)}\n`),
              )
            }
          } catch {
            /* skip malformed chunks */
          }
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
