import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function generatePDF(
  elementId: string,
  fileName: string = 'report.pdf',
  options: {
    scale?: number
    quality?: number
    margin?: number
  } = {}
) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  const { scale = 2, quality = 95, margin = 0 } = options

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Get canvas dimensions
    const imgWidth = canvas.width
    const imgHeight = canvas.height

    // Calculate PDF dimensions to match canvas aspect ratio
    // Using points: 72 points = 1 inch
    const pdfWidth = (imgWidth / 96) * 72 // Convert pixels to points (assuming 96 DPI)
    const pdfHeight = (imgHeight / 96) * 72

    // Create PDF with custom dimensions
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pdfWidth + margin * 2, pdfHeight + margin * 2],
    })

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', quality / 100)

    // Add image to PDF with margin
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth / 96 * 72, imgHeight / 96 * 72)

    // Force download
    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
