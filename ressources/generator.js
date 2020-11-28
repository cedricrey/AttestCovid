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

async function generateAttestation(user, exitDate, reasons, files){
  const encryptedPdfBytes = await fetch('ressources/certificate_v2.pdf').then(res => res.arrayBuffer())
  //const encryptedPdfBytes = await fetch('https://raw.githubusercontent.com/cedricrey/AttestCovid/main/ressources/certificate_v2.pdf').then(res => res.arrayBuffer())
  //var user = users[userName];
  //, exitDate = null, reasons = 'travail-sante';
  //console.log(pdfDoc);
  var pdfDocPromise = PDFDocument.load(encryptedPdfBytes);
  if( user )
    return pdfDocPromise.then( generatePdf.bind( this, user, exitDate, reasons, files ) );
  return null;
/*
  const preparePdfGeneration = ( user ) => {
    return PDFDocument.load(encryptedPdfBytes);
  };
  preparePdfGeneration( user ).then( generatePdf );
  */
}



async function generatePdf( user, exitDate, reasons, files, pdfDoc ){
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
  ]);
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
    travail: 553,
    achats_culturel_cultuel: 482,
    sante: 434,
    famille: 410,
    handicap: 373,
    sport_animaux: 349,
    convocation: 276,
    missions: 252,
    enfants: 228,
  };


  drawText(`${user.prenom} ${user.nom}`, 92, 702);
  drawText(user.birthday, 92, 684);
  drawText(user.lieunaissance, 214, 684);
  drawText(`${user.adresse} ${user.codepostal} ${user.ville}`, 104, 665);

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
      drawText('x', 47, ys[ reason ], 12);
  });

  let locationSize = idealFontSize(font, user.ville, 83, 7, 11)

  if (!locationSize) {
    console.log('Le nom de la ville risque de ne pas être affiché correctement en raison de sa longueur. ' +
      'Essayez d\'utiliser des abréviations ("Saint" en "St." par exemple) quand cela est possible.')
    locationSize = 7
  }
  drawText(user.ville, 78, 76, locationSize)

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

  drawText(datesortie, 63, 58, 11)
  //drawText(`${releaseHours}:${releaseMinutes}`, 264, 153, 11)
  drawText(`${creationHour}`, 227, 58, 11)


  var data = [
      `Cree le: ${creationDateStr} a ${creationHour}`,
      `Nom: ${user.nom}`,
      `Prenom: ${user.prenom}`,
      `Naissance: ${user.birthday} a ${user.lieunaissance}`,
      `Adresse: ${user.adresse} ${user.codepostal} ${user.ville}`,
      `Sortie: ${datesortie} a ${releaseHours}h${releaseMinutes}`,
      `Motifs: ${reasons}`,
      "",
    ].join(';\n ');

  const generatedQR = await generateQR(data);

  const qrImage = await pdfDoc.embedPng(generatedQR)

  page1.drawImage(qrImage, {
    x: page1.getWidth() - 156,
    y: 25,
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

  for(var i=0; i<files.length; i++) {
    file = files[i];
    if( file.fileType.toLowerCase().indexOf("image") == 0 )
      await addImageToPDF(pdfDoc, file);
    if( file.fileType.toLowerCase().indexOf("application/pdf") == 0 )
      await addPDFToPDF(pdfDoc, file);
  };


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
async function addImageToPDF(pdfDoc, file){
  var page = pdfDoc.addPage();
  var image, dims;
  if( file.fileType.toLowerCase() == "image/jpeg")
   {
     image = await pdfDoc.embedJpg(file.fileContent);
   }
  if( file.fileType.toLowerCase() == "image/png")
   {
     image = await pdfDoc.embedPng(file.fileContent);
   }
   dims = image.scale(1);
   console.log('page.getWidth().width : ', page.getWidth())
   page.drawImage(image, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });
}

async function addPDFToPDF(pdfDoc, file){
  //console.log('I addPDFToPDF');
  const pdfToCopy = await PDFDocument.load(file.fileContent);
  const copiedPages = await pdfDoc.copyPages(pdfToCopy, pdfToCopy.getPageIndices());
    copiedPages.forEach((page) => {
      console.log('I copy a page : ', page );
      pdfDoc.addPage(page);
      console.log('I copy a page  pdfDoc : ', pdfDoc );
    });
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
    //console.log( reasons.join(', '))
    user = {
      adresse: localStorage.adresse || "",
      birthday: new Date(localStorage.birthday  || null ).toLocaleString().substr(0,10),
      codepostal: localStorage.codepostal || "",
      lieunaissance: localStorage.lieunaissance || "",
      nom: localStorage.nom || "",
      prenom: localStorage.prenom || "",
      ville: localStorage.ville || ""
    };
    var files = [];
    $('#generateForm input[name="addFile"]:checked').each( (i, el) =>{
      files.push(localFiles[ $(el).val() ]);
    });

    try{
      generateAttestation( user, new Date(), reasons.join(', '), files ).then( (pdfBytes) => {
        var generatedDate = new Date();
        generatedDate.setMinutes( generatedDate.getMinutes() - 10 );
        var generatedDateStr =   `${generatedDate.getFullYear()}-${pad(generatedDate.getMonth() + 1)}-${pad(generatedDate.getDate())}_${pad(generatedDate.getHours())}-${pad(generatedDate.getMinutes())}`

        download(pdfBytes, `attestation-${generatedDateStr}.pdf`, "application/pdf");
      })
      .catch(
        ( e ) => {
          alert("Erreur : " + e );
        }
      )
    }
    catch( e ){
      alert("Erreur : " + e );
    }
    return false;
  }
var localFiles = {};

function initGenerator(){
  if( typeof localStorage.nom == "undefined" )
    displayNoConfigMessage();

  //Gestion des fichiers supplémentaire
  if( typeof localStorage.localFiles != "undefined" )
    localFiles = JSON.parse( localStorage.localFiles );

  for(var name in localFiles){
    var currFile = localFiles[name];
    if(currFile.fileReason && currFile.fileReason != "none" && $(`#generateForm input[name="reason"][value=${currFile.fileReason}]`).length != 0 )
      $(`#generateForm input[name="reason"][value=${currFile.fileReason}]`)
        .parent()
        .append( $(`<div class="addFileBloc"><input class="form-check-input" type="checkbox" name="addFile" id="addFile-${name}" value="${name}"/><label class="form-check-label" for="addFile-${name}">${name}<br/><i class="far fa-file-image"></i></label></div>`));
        //.append( $(`<input class="form-check-input" type="checkbox" name="addFile" id="addFile-${name}" value="${name}"/>`))
        //.append( $(`<label class="form-check-label" for="addFile-${name}">${name}</label>`));
    else {
      $('#reasonGrid')
        .append( $(`<div class="addFileBloc"><input class="form-check-input" type="checkbox" name="addFile" id="addFile-${name}" value="${name}"/><label class="form-check-label" for="addFile-${name}">Ajouter le fichier ${name} <br/> <i class="far fa-file-image"></i> </label></div>`));
        //.append( $(`<input class="form-check-input" type="checkbox" name="addFile" id="addFile-${name}" value="${name}"/>`))
        //.append( $(`<label class="form-check-label" for="addFile-${name}">${name}</label>`))
    }
  }

}
function displayNoConfigMessage(){
  var divInfo = $('<div class="error">').html(`Il semble que vous n'ayez pas <a href="config.html">configuré vos données personnelles</a>`);
  $('#info').append( divInfo );
}
function changeFormValue(){
  $('#generateForm input[name="reason"]').each( (i, el) =>{
    if( $(el).is(':checked') )
      $(el).parent().addClass('active');
    else
      $(el).parent().removeClass('active');
  });
}
