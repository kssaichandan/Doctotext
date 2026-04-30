# DocToText 📄✨

🟢 **Live Demo:** [https://doctotext-173e.onrender.com/](https://doctotext-173e.onrender.com/)

**DocToText** is a sleek, modern, and stateless web application that extracts raw text from various document formats (PDF, DOCX, PPTX, JPG, PNG). With an emphasis on privacy, efficiency, and a premium "glassmorphism" aesthetic, it acts as a perfect pipeline tool to convert your complex documents into cleanly formatted text for AI analysis or record-keeping.

## 🚀 What it Does
- **Multi-Format Extraction**: Parses standard files (`.docx`, `.pdf`, `.pptx`) and extracts text locally using fast Python libraries (`PyMuPDF`, `python-docx`).
- **Advanced OCR Integration**: Integrates directly with the **Gemini 2.5 Vision API** to perform deep Optical Character Recognition (OCR) on image files (`.jpg`, `.png`) or scanned PDFs where standard text selection isn't possible.
- **Stateless & Secure**: The backend operates entirely in memory. It *does not use a database* and NEVER saves your files, extracted text, or API keys to a server disk. Your API keys are strictly kept within your browser's local storage.
- **Smart Chunking**: Split massive merged texts into cleanly broken segments based on character or token limits (e.g., 4000 tokens per chunk), which makes it perfect for feeding context into LLMs like ChatGPT or Claude.
- **Export Formats**: Consolidate multiple uploaded document contents and download them as a single `.txt` or `.docx` file.

## 💡 What it's Useful For
- **Prompt Engineering & AI Context**: Have a massive 40-page PDF or PowerPoint presentation that you need ChatGPT or Claude to summarize? DocToText quickly strips away the styling and outputs pure text, chunked perfectly to bypass token limits.
- **Image-to-Text Conversion**: Convert scanned receipts, screenshots, or unsearchable PDFs into usable text.
- **Batch Processing Workspace**: Upload 5 different files of varying formats, get the text from all of them at once, and export it into a single clean `.docx` or `.txt` file, saving significant manual copy-pasting effort.

## 🎨 UI/UX Features
- **Premium Glassmorphism Design**: Frosted glass panels, dynamic gradients, smooth micro-animations, and sleek dark/light mode toggling.
- **Modern Typography**: Driven by `Outfit`, `Inter`, and `JetBrains Mono`.
- **Real-Time Token Estimation**: Watch as the app dynamically calculates characters, words, and token counts to help you gauge LLM context limits.
- **Paste Input**: Paste copied files, screenshots, clipboard images, or raw text directly into the app. Pasted text is queued as a `.txt` source.
- **Local LLM OCR**: Use an Ollama-compatible local vision model instead of Gemini/OpenAI/Anthropic for images and scanned PDFs.

## Local LLM Setup

DocToText talks to the local model from the Flask backend. Chrome opens the DocToText web page, uploads the file to Flask, and Flask sends image pages to the local LLM for OCR.

Important flow:

```text
Chrome/browser -> DocToText Flask app -> Ollama/local LLM
```

That means your browser does not need to connect directly to the local LLM in normal use. The browser only needs to reach DocToText. DocToText then reaches Ollama from the PC where `python app.py` is running.

### If DocToText is downloaded and running on your own PC

Use this setup when you cloned/downloaded this project and are running it locally.

1. Install Ollama from `https://ollama.com`.
2. Pull a vision-capable model:

   ```powershell
   ollama pull llama3.2-vision
   ```

3. Start Ollama. On most installs it runs automatically. You can check it with:

   ```powershell
   ollama list
   ```

4. Open a terminal in the `Doctotext-main` folder.
5. Install Python dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

6. Start DocToText:

   ```powershell
   python app.py
   ```

7. Open Chrome and go to:

   ```text
   http://localhost:5000
   ```

8. Open `Settings`.
9. Set `OCR provider` to `Local LLM`.
10. Use these values:

   ```text
   Local server URL: http://localhost:11434
   Vision model: llama3.2-vision
   ```

11. Click `Save Local`.
12. Click `Test Local`.
13. Upload or paste an image/scanned PDF and click `Extract All Text`.

### Model Selection

DocToText now supports model selection in Settings.

For cloud OCR:

- Set `OCR provider` to `Cloud API key`.
- Paste your Gemini/OpenAI/Anthropic API key.
- The `Cloud model` dropdown changes based on the key type:
  - Gemini keys usually start with `AIza`.
  - OpenAI keys usually start with `sk-`.
  - Anthropic keys usually start with `sk-ant`.
- Click `Save Key`.
- Click `Test Format` to test that key and selected model together.

For local OCR:

- Set `OCR provider` to `Local LLM`.
- Set `Local server URL`, usually `http://localhost:11434`.
- Click `Refresh` beside the `Vision model` dropdown.
- Choose one of the models installed in your local Ollama.
- Click `Save Local`.
- Click `Test Local`.

The local model dropdown is loaded from Ollama's `/api/tags` endpoint. It is not hardcoded. If it says `No local models found`, install a vision model first:

```powershell
ollama pull llama3.2-vision
```

Then click `Refresh` again.

If you choose a model that your provider/account/local Ollama install does not have, the test button will fail. Pick another model or pull/install the model first.

If the test fails, first check that Ollama is running and that the model exists:

```powershell
ollama list
ollama run llama3.2-vision
```

You can stop the test chat with `Ctrl+C`.

### Browser and PC Connection Notes

#### Case 1: Chrome, DocToText, and Ollama are all on the same PC

Use:

```text
DocToText URL in Chrome: http://localhost:5000
Local LLM URL in Settings: http://localhost:11434
```

This is the easiest and recommended local setup.

#### Case 2: Chrome is on another phone/laptop, but DocToText and Ollama are on your PC

Open DocToText from the other device using your PC LAN IP:

```text
http://YOUR_PC_LAN_IP:5000
```

Example:

```text
http://192.168.1.25:5000
```

In DocToText Settings, still use:

```text
Local LLM URL: http://localhost:11434
```

Why? Because Flask is running on your PC, and Flask is the thing calling Ollama. In this case, `localhost` means the PC running DocToText, not the phone/laptop browser.

If the browser cannot open DocToText from another device, allow Python/Flask through Windows Firewall and make sure both devices are on the same Wi-Fi/network.

#### Case 3: DocToText is on one PC, Ollama is on another PC

In DocToText Settings, set:

```text
Local LLM URL: http://OLLAMA_PC_LAN_IP:11434
```

Example:

```text
http://192.168.1.40:11434
```

On the Ollama PC, allow Ollama to listen on the network:

```powershell
$env:OLLAMA_HOST="0.0.0.0:11434"
ollama serve
```

Also allow port `11434` through the firewall on the Ollama PC.

### Can Chrome connect directly to the local LLM?

Technically Chrome can call a local server only if the local LLM server allows browser requests and CORS, but DocToText does not need that. The app is designed so Chrome talks to Flask, and Flask talks to Ollama.

Use this mental model:

```text
Good setup: Chrome -> Flask -> Ollama
Not needed: Chrome -> Ollama directly
```

Keeping the LLM call in Flask avoids browser CORS problems and keeps the UI simpler.

### What happens to photos or images inside documents?

Current behavior depends on the file type:

- Normal PDF text: extracted in reading order from each page.
- Scanned PDF pages: OCR runs per page. The extracted OCR text is placed under that page, so it stays close to the original page position in the final output.
- Standalone image files (`.jpg`, `.jpeg`, `.png`): OCR output appears as that image file's extracted text.
- Pasted screenshots/images: treated like standalone image files.
- DOCX/PPTX normal text: text is extracted from paragraphs, tables, slides, and notes.
- Images embedded inside DOCX/PPTX: the app currently detects that an image exists and inserts a placeholder, but it does not extract the embedded image text yet.

So if a PDF page has normal text with a photo in the middle, the final output will keep the page text and OCR scanned pages by page. Exact image-in-the-middle placement is best for scanned full pages, not embedded DOCX/PPTX images.

If an image itself contains text, local LLM OCR can read that text when the image is uploaded/pasted as an image file or when the whole PDF page is OCR'd. If the image contains another smaller image inside it, the local LLM will only output text it can visually read from the pixels. It will not preserve the actual picture, only text found in the picture.

### Limitations of Local LLM OCR

- Local LLM OCR only works well with vision models. Text-only models will connect but will not read images correctly.
- Local models can be slower than cloud OCR, especially on CPU-only machines.
- OCR quality depends on the model, image clarity, font size, rotation, and language.
- The final output is text only. Photos/images are not copied into the `.txt`, `.md`, or `.docx` export.

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.9+
- A Google Gemini API Key (optional, but highly recommended for OCR features)

*(Note: Add your Gemini API key strictly through the "Settings" button in your browser UI—it will persist securely via your Local Storage.)*

## contact info:kssaichandan@gmail.com
