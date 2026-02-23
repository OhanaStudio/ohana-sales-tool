console.log("Fetching thatcherscider.co.uk HTML...")

fetch("https://thatcherscider.co.uk")
  .then(res => res.text())
  .then(html => {
    console.log("\n=== HTML LENGTH:", html.length, "===\n")
    
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi
    const matches = [...html.matchAll(h1Regex)]
    
    console.log("Found", matches.length, "H1 tags in raw HTML\n")
    
    if (matches.length > 0) {
      matches.forEach((match, i) => {
        const text = match[1].replace(/<[^>]+>/g, '').trim().slice(0, 100)
        console.log(`H1 #${i + 1}: "${text}"`)
      })
    } else {
      console.log("\n⚠️  NO H1 TAGS FOUND IN RAW HTML")
      console.log("This is likely a JavaScript-rendered site where H1s are added after page load.\n")
      console.log("First 1000 chars of HTML:")
      console.log(html.slice(0, 1000))
    }
  })
  .catch(err => console.error("Error:", err))
