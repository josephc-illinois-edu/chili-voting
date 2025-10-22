/**
 * QR code generation for chili voting stations
 * @fileoverview Generate QR codes for direct voting links
 */

import QRCode from 'qrcode';

export class QRCodeGenerator {
  /**
   * Generate QR code for a specific chili
   * @param chiliId Unique chili identifier
   * @param baseUrl Base application URL
   * @returns Promise<string> Base64 encoded QR code image
   */
  static async generateChiliQR(chiliId: string, baseUrl: string): Promise<string> {
    const votingUrl = `${baseUrl}/vote?chili=${chiliId}`;

    try {
      const qrDataURL = await QRCode.toDataURL(votingUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate printable QR code labels for all chilis
   * @param chilis Array of chili entries
   * @param baseUrl Base application URL
   * @returns Promise<Array> QR code data for printing
   */
  static async generateAllQRCodes(
    chilis: { id: string; name: string; contestant_name: string }[],
    baseUrl: string
  ): Promise<Array<{
    chiliId: string;
    chiliName: string;
    contestantName: string;
    qrCode: string;
    votingUrl: string;
  }>> {
    const qrCodes = await Promise.all(
      chilis.map(async (chili) => {
        const qrCode = await this.generateChiliQR(chili.id, baseUrl);
        return {
          chiliId: chili.id,
          chiliName: chili.name,
          contestantName: chili.contestant_name,
          qrCode,
          votingUrl: `${baseUrl}/vote?chili=${chili.id}`
        };
      })
    );

    return qrCodes;
  }

  /**
   * Generate HTML for printable QR code tent cards
   * @param qrCodes QR code data from generateAllQRCodes
   * @returns string HTML content for printing
   */
  static generatePrintableHTML(qrCodes: Array<{
    chiliId: string;
    chiliName: string;
    contestantName: string;
    qrCode: string;
  }>): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Chili Cook-Off QR Codes</title>
    <style>
        @media print {
            .page-break { page-break-before: always; }
        }
        .tent-card {
            width: 4in;
            height: 6in;
            border: 2px solid #000;
            margin: 0.25in;
            padding: 0.25in;
            display: inline-block;
            text-align: center;
            vertical-align: top;
            box-sizing: border-box;
        }
        .qr-code {
            width: 2in;
            height: 2in;
            margin: 0.25in auto;
        }
        .chili-name {
            font-size: 18pt;
            font-weight: bold;
            margin: 0.1in 0;
        }
        .contestant-name {
            font-size: 14pt;
            margin: 0.1in 0;
        }
        .instructions {
            font-size: 10pt;
            margin-top: 0.2in;
        }
    </style>
</head>
<body>
    ${qrCodes.map((qr, index) => `
        <div class="tent-card ${index % 4 === 0 ? 'page-break' : ''}">
            <div class="chili-name">${qr.chiliName}</div>
            <div class="contestant-name">by ${qr.contestantName}</div>
            <img src="${qr.qrCode}" alt="QR Code" class="qr-code" />
            <div class="instructions">
                Scan with your phone camera<br>
                to vote on this chili!
            </div>
        </div>
    `).join('')}
</body>
</html>`;
  }
}
