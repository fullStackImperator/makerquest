import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL =
  process.env.FASTAPI_URL ??
  process.env.NEXT_PUBLIC_FASTAPI_URL ??
  'http://localhost:8000'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const upstream = new FormData()
  upstream.append(
    'file',
    file,
    file instanceof File ? file.name : 'image.png',
  )

  let res: Response
  try {
    res = await fetch(`${FASTAPI_URL}/pix2text`, {
      method: 'POST',
      body: upstream,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          'OCR server unreachable. Start FastAPI with: python main.py (port 8000)',
      },
      { status: 503 },
    )
  }

  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
