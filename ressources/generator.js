#!/usr/bin/env node
//import { PDFDocument, StandardFonts } from 'pdf-lib'
//import QRCode from 'qrcode'
//var PDFDocument = require('pdf-lib').PDFDocument;
//var StandardFonts = require('pdf-lib').StandardFonts;
//var QRCode = require('qrcode');
var PDFDocument = PDFLib.PDFDocument;
var StandardFonts = PDFLib.StandardFonts;



//const pdfBase = require.resolve('./certificate.pdf');
//var users = require("./users.json")

const generateQR = async text => {
  try {
    var opts = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
    }
    return await QRCode.toDataURL(text, opts)
  } catch (err) {
    console.error(err)
  }
}

//var encryptedPdfBytes = fs.readFileSync(pdfBase);

async function generateAttestation(user, exitDate, reasons){
  const encryptedPdfBytes = await fetch('ressources/certificate.pdf').then(res => res.arrayBuffer())
  //var user = users[userName];
  //, exitDate = null, reasons = 'travail-sante';
  //console.log(pdfDoc);
  var pdfDocPromise = PDFDocument.load(encryptedPdfBytes);
  if( user )
    return pdfDocPromise.then( generatePdf.bind( this, user, exitDate, reasons ) );
  return null;
/*
  const preparePdfGeneration = ( user ) => {
    return PDFDocument.load(encryptedPdfBytes);
  };
  preparePdfGeneration( user ).then( generatePdf );
  */
}



async function generatePdf( user, exitDate, reasons, pdfDoc ){
//console.log('Reasons ? ', reasons)
  pdfDoc.setTitle('COVID-19 - Déclaration de déplacement')
  pdfDoc.setSubject('Attestation de déplacement dérogatoire')
  pdfDoc.setKeywords([
    'covid19',
    'covid-19',
    'attestation',
    'déclaration',
    'déplacement',
    'officielle',
    'gouvernement',
  ])
  pdfDoc.setProducer('DNUM/SDIT')
  pdfDoc.setCreator('')
  pdfDoc.setAuthor("Ministère de l'intérieur")
  const page1 = pdfDoc.getPages()[0];
  /*
  const fontPromise = pdfDoc.embedFont(StandardFonts.Helvetica);
  fontPromise.then( font => {
    const drawText = (text, x, y, size = 11) => {
      page1.drawText(text, { x, y, size, font })
    }

    drawText(`${firstname} ${lastname}`, 123, 686);
    const pdfSaving = pdfDoc.save();
    pdfSaving.then( pdfBytes => {
      fs.writeFileSync('attestation.pdf', pdfBytes);
    })
  });
  */
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const drawText = (text, x, y, size = 11) => {
    page1.drawText(text, { x, y, size, font })
  }

  const ys = {
    travail: 578,
    achats: 533,
    sante: 477,
    famille: 435,
    handicap: 396,
    sport_animaux: 358,
    convocation: 295,
    missions: 255,
    enfants: 211,
  };


  drawText(`${user.prenom} ${user.nom}`, 119, 696);
  drawText(user.birthday, 119, 674);
  drawText(user.lieunaissance, 297, 674);
  drawText(`${user.adresse} ${user.codepostal} ${user.ville}`, 133, 652);

  if( !reasons || reasons == "" )
    reasons = "courses";
  /*
  if (reasons.includes('travail')) {
      drawText('x', 76, 527, 19)
  }
  if (reasons.includes('courses')) {
    drawText('x', 76, 478, 19)
  }
  if (reasons.includes('sante')) {
    drawText('x', 76, 436, 19)
  }
  if (reasons.includes('famille')) {
    drawText('x', 76, 400, 19)
  }
  if (reasons.includes('sport')) {
    drawText('x', 76, 345, 19)
  }
  if (reasons.includes('judiciaire')) {
    drawText('x', 76, 298, 19)
  }
  if (reasons.includes('missions')) {
    drawText('x', 76, 260, 19)
  }*/
  var reasonsArray = reasons.split(', ');
  reasonsArray.forEach(
     reason => {
      drawText('x', 84, ys[ reason ], 18);
  });

  let locationSize = idealFontSize(font, user.ville, 83, 7, 11)

  if (!locationSize) {
    console.log('Le nom de la ville risque de ne pas être affiché correctement en raison de sa longueur. ' +
      'Essayez d\'utiliser des abréviations ("Saint" en "St." par exemple) quand cela est possible.')
    locationSize = 7
  }
  drawText(user.ville, 105, 177, locationSize)

  var creationDate = new Date();
  creationDate.setMinutes( creationDate.getMinutes() - 10 );
  var creationDateStr =   `${pad(creationDate.getDate())}/${pad(creationDate.getMonth() + 1)}/${creationDate.getFullYear()}`
  var creationHour = `${pad(creationDate.getHours())}h${pad(creationDate.getMinutes())}`;

  // Date création
   //drawText('Date de création:', 464, 150, 7)
   //drawText(`${creationDateStr} à ${creationHour}`, 455, 144, 7)

   if( !exitDate )
    exitDate = new Date();
   //exitDate.setMinutes( creationDate.getMinutes() - 10 );
   var datesortie =   `${pad(exitDate.getDate())}/${pad(exitDate.getMonth() + 1)}/${exitDate.getFullYear()}`
   var releaseHours = `${pad(exitDate.getHours())}`
   var releaseMinutes = `${pad(exitDate.getMinutes())}`;
   /*
   drawText(datesortie, 92, 200);
   drawText(releaseHours, 200, 201);
   drawText(releaseMinutes, 220, 201);
    */

  drawText(datesortie, 91, 153, 11)
  //drawText(`${releaseHours}:${releaseMinutes}`, 264, 153, 11)
  drawText(`${creationDateStr}:${creationHour}`, 264, 153, 11)


  var data = [
      `Cree le: ${creationDateStr} a ${creationHour}`,
      `Nom: ${user.nom}`,
      `Prenom: ${user.prenom}`,
      `Naissance: ${user.birthday} a ${user.lieunaissance}`,
      `Adresse: ${user.adresse} ${user.codepostal} ${user.ville}`,
      `Sortie: ${datesortie} a ${releaseHours}h${releaseMinutes}`,
      `Motifs: ${reasons}`,
    ].join(';\n ');

  const generatedQR = await generateQR(data);

  const qrImage = await pdfDoc.embedPng(generatedQR)

  page1.drawImage(qrImage, {
    x: page1.getWidth() - 156,
    y: 100,
    width: 92,
    height: 92,
  })

  pdfDoc.addPage()
  const page2 = pdfDoc.getPages()[1]
  page2.drawImage(qrImage, {
    x: 50,
    y: page2.getHeight() - 350,
    width: 300,
    height: 300,
  })


  const pdfBytes = await pdfDoc.save();
  /*
  try{
  fs.writeFileSync(`${__dirname}/generated_attestations/attestation-${user.prenom}-${creationDate.getFullYear()}-${pad(creationDate.getMonth() + 1)}-${pad(creationDate.getDate())}_${pad(creationDate.getHours())}-${pad(creationDate.getMinutes())}.pdf`, pdfBytes);
  }
  catch(err){
    console.log('Erreur ? ', err);
  }
  */
  return pdfBytes;
}
function pad (str) {
  return String(str).padStart(2, '0')
}
function idealFontSize (font, text, maxWidth, minSize, defaultSize) {
  let currentSize = defaultSize
  let textWidth = font.widthOfTextAtSize(text, defaultSize)

  while (textWidth > maxWidth && currentSize > minSize) {
    textWidth = font.widthOfTextAtSize(text, --currentSize)
  }

  return (textWidth > maxWidth) ? null : currentSize
}

 function generateAttest(){
    //console.log("I generate !!!");
    var reasons = [];
    $('#generateForm input[name="reason"]:checked').each( (i, el) =>{
      reasons.push($(el).val());
    });
    console.log( reasons.join(', '))
    user = {
      adresse: localStorage.adresse,
      birthday: new Date(localStorage.birthday).toLocaleString().substr(0,10),
      codepostal: localStorage.codepostal,
      lieunaissance: localStorage.lieunaissance,
      nom: localStorage.nom,
      prenom: localStorage.prenom,
      ville: localStorage.ville
    };
    generateAttestation( user, new Date(), reasons.join(', ') ).then( (pdfBytes) => {
      download(pdfBytes, "attestation.pdf", "application/pdf");
    })
    return false;
  }
