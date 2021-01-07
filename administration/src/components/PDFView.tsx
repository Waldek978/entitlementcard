import React, {useEffect, useState} from "react";
import PDFDocument from 'pdfkit'
import blobStream from 'blob-stream'
import {
    QRCodeEncoder,
    QRCodeDecoderErrorCorrectionLevel as ErrorCorrectionLevel,
    IllegalStateException,
    QRCodeEncoderQRCode as QRCode, EncodeHintType
} from '@zxing/library';

const QUIET_ZONE_SIZE = 10

// Adapted from https://github.com/zxing-js/library/blob/d1a270cb8ef3c4dba72966845991f5c876338aac/src/browser/BrowserQRCodeSvgWriter.ts#L91
const renderPdf = (doc: typeof PDFDocument, data: string, hints?: Map<EncodeHintType, any>, width = 500, height = 500) => {
    let errorCorrectionLevel = ErrorCorrectionLevel.L;
    let quietZone = QUIET_ZONE_SIZE;

    if (hints) {
        if (hints.get(EncodeHintType.ERROR_CORRECTION)) {
            errorCorrectionLevel = ErrorCorrectionLevel.fromString(hints.get(EncodeHintType.ERROR_CORRECTION).toString());
        }

        if (hints.get(EncodeHintType.MARGIN)) {
            quietZone = Number.parseInt(hints.get(EncodeHintType.MARGIN).toString(), 10);
        }
    }

    const code: QRCode = QRCodeEncoder.encode(data, errorCorrectionLevel, hints);
    
    const input = code.getMatrix();
    if (input === null) {
        throw new IllegalStateException();
    }
    
    const inputWidth = input.getWidth();
    const inputHeight = input.getHeight();
    const qrWidth = inputWidth + (quietZone * 2);
    const qrHeight = inputHeight + (quietZone * 2);
    const outputWidth = Math.max(width, qrWidth);
    const outputHeight = Math.max(height, qrHeight);

    const multiple = Math.min(Math.floor(outputWidth / qrWidth), Math.floor(outputHeight / qrHeight));


    // Padding includes both the quiet zone and the extra white pixels to accommodate the requested
    // dimensions. For example, if input is 25x25 the QR will be 33x33 including the quiet zone.
    // If the requested size is 200x160, the multiple will be 4, for a QR of 132x132. These will
    // handle all the padding from 100x100 (the actual QR) up to 200x160.
    const leftPadding = Math.floor((outputWidth - (inputWidth * multiple)) / 2);
    const topPadding = Math.floor((outputHeight - (inputHeight * multiple)) / 2);

    let pathData = ""
    for (let inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++ , outputY += multiple) {
        // Write the contents of this row of the barcode
        for (let inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++ , outputX += multiple) {
            if (input.get(inputX, inputY) === 1) {
                // doc.rect(outputX, outputY, multiple, multiple)
                // doc.fill('black')
                var w = multiple + outputX
                var h = multiple + outputY
                pathData += ('M' + outputX + ',' + outputY + ' V' + h + ' H' + w + ' V' + outputY + ' H' + outputX + ' Z ');
            }
        }
    }
    doc.path(pathData)
    doc.fill('black')
    console.log(pathData)
}

export default () => {
    const [pdfBlob, setPDFBlob] = useState<string | null>(null)

    useEffect(() => {
        const fs = require('fs')
        // eslint-disable-next-line
        fs.writeFileSync('data/Helvetica.afm', require('!!raw-loader!pdfkit/js/data/Helvetica.afm').default)
        const doc = new PDFDocument();
        const stream = doc.pipe(blobStream());

        const hints = new Map()
        hints.set(EncodeHintType.MARGIN, 10)
        hints.set(EncodeHintType.QR_VERSION, 7) // 224 characters
        renderPdf(doc, "A".repeat(223), hints)

        // doc.fontSize(25).text('Here is some vector graphixxx...', 100, 80);

        doc.end();
        stream.on('finish', function () {
            setPDFBlob(stream.toBlobURL('application/pdf'))
        });
    }, [])

    return (
        <iframe width="775" height="775" src={pdfBlob || ""}/>
    )
}
