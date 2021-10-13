/*
------------------------------------------------------------------------------
 jaap.js
 Copyright (C) 2019-2020  Armin Warias

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
------------------------------------------------------------------------------
*/


//------------------------------------------------------------------------------
// Default Werte setzen
//------------------------------------------------------------------------------

var version = "alpha 0.0.35";
var test_modus = document.getElementById("info").innerHTML;
var radix = 0;
var transit = 0;
var hcgi;
var db_str = "";
var create_new = 0;
sessionStorage.setItem('modal', 0);

if (test_modus == "radix") {
   radix = 1;
   sessionStorage.setItem('radix', 1);	
   var rname = document.getElementById("rmode").innerHTML;
   sessionStorage.setItem('name', rname);
} 

//prüfen ob ein home long und lat gesetzt ist, wenn ja im localStorage speichern
if (radix == 0) {
   if (document.getElementById("homecgi").innerHTML) { 
      hcgi = document.getElementById("homecgi").innerHTML;
      localStorage.setItem('home', hcgi);
   }
   else if (localStorage.getItem('home')) {
      hcgi = localStorage.getItem('home');
   }
   else {
      localStorage.setItem('home', '11.08 49.45');
   }
}

function show_tz() {
   var tzi = document.getElementById("tzi").innerHTML;
   document.getElementById("info").innerHTML = tzi;
}

function set_date() {
   set("Alle");
}

// Datenbank aufrufen
//jaap_db("c");


//------------------------------------------------------------------------------
// listener laden
//------------------------------------------------------------------------------
load_listener();
set_modal();

//------------------------------------------------------------------------------
//values der listboxen manipulieren
//------------------------------------------------------------------------------
function setval(id, value, key) {    
    let element = document.getElementById(id);
    element.value = value;
    sessionStorage.setItem(key, value);
}

if (radix == 0) {
   //default Werte setzen
   sessionStorage.setItem('planet', 'Alle');
   sessionStorage.setItem('offset', 'Stunde');
   sessionStorage.setItem('multi', 1);
   sessionStorage.setItem('radix', 0);
   sessionStorage.setItem('transit', 0);
   sessionStorage.setItem('rxstr', '');
   sessionStorage.setItem('name', '');
   sessionStorage.setItem('ort', '');
}

//Häuser auswahl disable wenn keine Uhrzeit
var dstr = document.getElementById("dst").innerHTML.split(" ");
if (dstr[1] == "") {
   document.getElementById('hsys').disable = true;
}

//restore hsys
if (radix == 0 && transit == 0) {
   document.getElementById('hsys').value = localStorage.getItem('hsys');
   reset();
   console.log("hsys restored!");
}


//------------------------------------------------------------------------------
// Funktion set_home_loc()
// setzt die home location
//------------------------------------------------------------------------------
function set_home_loc() {
   var lostr = document.querySelector("#long").value;
   var lastr = document.querySelector("#lat").value;
   var urlstr = window.location.href + "?hlo=" + lostr + "&hla=" + lastr;
   window.open(urlstr,"_top");
   console.log (urlstr);
}


//------------------------------------------------------------------------------
// Funktion load_listener
// Nach einem XHR müssen alle listener neu geladen werden
//------------------------------------------------------------------------------
function load_listener (){

   //Planeten Listbox
   var planets = document.getElementById('planets');
   planets.onchange = function() {
      set (planets.value);
   }


   //Häuser Listbox
   var hsys = document.getElementById('hsys');
   hsys.onchange = function() {
      localStorage.setItem('hsys', hsys.value);
      set (planets.value);
   }

   //Debug
   //var dbg = document.getElementById("dbg").innerHTML;
   //console.log (dbg);

   document.getElementById("txtform").reset();

   //Offset Listbox
   if (document.getElementById('offset') !== null) {
      var change_offset = document.getElementById('offset'); 
      change_offset.onchange = function() {
         document.getElementById("info").innerHTML = "set " + change_offset.value;
	 sessionStorage.setItem('offset', change_offset.value);
      }
   }
   if (radix == 0) {
      document.getElementById('offset').value = sessionStorage.getItem('offset');
   }

   //Multiplikator Listbox
   if (document.getElementById('mult') !== null) {
      var multi = document.getElementById('mult');
      multi.onfocus = function() {
         modal = 1;
	 sessionStorage.setItem('modal', 1);
      }
      multi.onblur = function() {
	 sessionStorage.setItem('multi', multi.value);
	 modal = 0;
	 sessionStorage.setItem('modal', 0);
      }
   }
   if (radix == 0) {
      document.getElementById('mult').value = sessionStorage.getItem('multi');
   }
}

//------------------------------------------------------------------------------
//Tastatur Eingaben Abfangen
//------------------------------------------------------------------------------
var elem = document.getElementById('Seite');
elem.addEventListener("keydown", TasteGedrueckt );
elem.addEventListener("keyup", TasteLosgelassen);


function TasteGedrueckt (evt) {
   if (evt.keyCode == 27) { //esc 
      modal = 0;
      sessionStorage.setItem('modal', 0);
      document.getElementById('subf').focus(); 
      set("Alle");
   }
   if (evt.keyCode == 84) { //t
     if (sessionStorage.getItem('radix') == 1 && sessionStorage.getItem('transit') == 0 && sessionStorage.getItem('modal') == 0) { set_transit(); } 
   }
   if (evt.keyCode == 82) { //r
     if (sessionStorage.getItem('transit') == 1 && sessionStorage.getItem('modal') == 0) { restore_radix() } 
   }
   if (sessionStorage.getItem('modal') == 0) {
      if (evt.keyCode == 49) { setval('offset', 'Minute', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 52) { setval('offset', 'Minute', 'offset'); setval('mult', 10, 'multi');}
      if (evt.keyCode == 50) { setval('offset', 'Stunde', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 51) { setval('offset', 'Tag', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 53) { setval('offset', 'Woche', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 54) { setval('offset', 'Monat', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 55) { setval('offset', 'Monat', 'offset'); setval('mult', 12, 'multi'); }
      if (evt.keyCode == 33 || evt.keyCode == 173) { if (radix == 0 || transit == 1) { set_offs("minus"); }} //PG up (+)
      if (evt.keyCode == 34 || evt.keyCode == 171) { if (radix == 0 || transit == 1) { set_offs("plus"); }}  //PG down (-)
      if (evt.keyCode == 76) { set_open(); } //L (load radix)
      if (evt.keyCode == 35) { set("Alle"); } //ende
      if (evt.keyCode == 36) { reset(); } //pos1
   }
}

function TasteLosgelassen(evt) {
   if (sessionStorage.getItem('modal') == 0) {
      if (evt.keyCode == 78) { //N (new radix)
         document.getElementById('neuradix').style.display = "block"; 
         document.getElementById('getname').focus(); 
	 modal = 1;
         sessionStorage.setItem('modal', 1);
      } 
   }

}


//------------------------------------------------------------------------------
// Funktion chk_version
// prüft ob die aktuelle Version auf dem client vorhanden ist und ob
// ein Häusersystem gesetzt ist.
//------------------------------------------------------------------------------
function chk_version() {
   var get_ver = localStorage.getItem('version');

   if (get_ver != version) {
     localStorage.setItem('version', version);
     show_about(); 
   }
}

//------------------------------------------------------------------------------
// Funktion show_info
// Zeigt rechts oben eine Information an auf welches Element die Maus zeigt
//------------------------------------------------------------------------------
function show_info (infostr) {
   document.getElementById("info").innerHTML = infostr;
}



//------------------------------------------------------------------------------
// Funktion set
// Registriert einen (Planeten) Filter und führt mit diesem einen XHR durch
//------------------------------------------------------------------------------
function set(planet) {
   if (planet == "Alle") { planet = ""; }
   //var elements = document.getElementById("dst").innerHTML.split(" ");
   var datestr = document.getElementById("dst").innerHTML;
   var multi = sessionStorage.getItem('multi');
   var hsys = localStorage.getItem('hsys');
   var radix = sessionStorage.getItem('radix');
   var name = sessionStorage.getItem('name');
   var trmode = sessionStorage.getItem('transit');
   if (sessionStorage.getItem('transit') == 1) {
      var datestr_tr = document.getElementById('dst').innerHTML;
      var datestr = sessionStorage.getItem('rxstr');
      sessionStorage.setItem('radix', 0);  
   }
   else {
      var datestr = document.getElementById('dst').innerHTML;
   }

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
	 sessionStorage.setItem('planet', planets.value);
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?dstr=' + datestr + '&dstr_tr=' + datestr_tr + '&filter=' + planet + '&multi=' + multi + '&hsys=' + hsys + '&radix=' + radix + '&name=' + name + '&transit=' + trmode, true);
   xmlhttp.send();        
}


//------------------------------------------------------------------------------
// Funktion set_now
//------------------------------------------------------------------------------
function set_now() {
   document.getElementById("info").innerHTML = "set NOW!!!";
}


//------------------------------------------------------------------------------
// Funktion print_offs
// Zeigt bei einem hover der plus und minus buttons den Eingestellten Offset an 
//------------------------------------------------------------------------------
function print_offs(op) {
   //alert(datestr + offs);
   var multi = sessionStorage.getItem('multi');
   var x;
   if (multi > 1) { x = "n"; }
   else { x = ""; }
   document.getElementById("info").innerHTML = op + " " + multi + " " + document.getElementById("offset").value + x;
}


//------------------------------------------------------------------------------
// Funktion set_offs
// Wenn ein offset über die + und - Funktion gesetzt wurde wird ein XHR mit diesen 
// Werten durchgefhrt
//------------------------------------------------------------------------------
function set_offs(op) {
   var offs = sessionStorage.getItem('offset');
   var planet = sessionStorage.getItem('planet');
   var multi = sessionStorage.getItem('multi');
   var hsys = localStorage.getItem('hsys');
   var trmode = sessionStorage.getItem('transit');
   var dst = localStorage.getItem('home').split(" ");
   if (sessionStorage.getItem('transit') == 1) { 
      var datestr_tr = document.getElementById('dst').innerHTML;
      var datestr = sessionStorage.getItem('rxstr');
      sessionStorage.setItem('radix', 0);
   }
   else {
      var datestr = document.getElementById('dst').innerHTML;
   }

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?dstr=' + datestr + '&dstr_tr=' + datestr_tr + '&offset=' + offs + '&op=' + op + '&filter=' + planet + '&multi=' + multi + '&hsys=' + hsys + '&transit=' + trmode  + '&hlo=' + dst[0] + '&hla=' + dst[1], true);
   xmlhttp.send();
}


//------------------------------------------------------------------------------
// Funktion set_transit
// Wenn die Transit Funktion gewählt wird, wird das Aktuelle radix im sessionStorage
// gespeichert. Anschliessend wird ein neuer XHR mit dem Aktuellen Datum und dem
// Radix durchgeführt. Als Ergebnis kommt das Transit Horoskop.
//------------------------------------------------------------------------------
function set_transit () {
   var rxstr = document.getElementById('dst').innerHTML;
   var dst = localStorage.getItem('home').split(" ");
   var hsys = localStorage.getItem('hsys');
   sessionStorage.setItem('rxstr', rxstr);
   sessionStorage.setItem('transit', 1);
   sessionStorage.setItem('radix', 0);
   transit = 1;
   radix = 0;

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?transit=1' + '&dstr=' + rxstr + '&hlo=' + dst[0] + '&hla=' + dst[1] + '&hsys=' + hsys);
   xmlhttp.send();

}


//------------------------------------------------------------------------------
// Funktion restore_radix
// Wenn vom Transit Horoskop wieder auf das Radix Horoskop gewechselt wird,
// lese ich das radix horoskop aus dem sessionStorage ein und führe mit diesem einen
// XHR durch. Als Ergebnis kommt wieder das Radix Horoskop.
//------------------------------------------------------------------------------
function restore_radix() {
   sessionStorage.setItem('transit', 0);
   var datestr = sessionStorage.getItem('rxstr');
   var hsys = localStorage.getItem('hsys');
   sessionStorage.setItem('radix', 1);
   radix =1;
   var name = sessionStorage.getItem('name');

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?dstr=' + datestr + '&hsys=' + hsys + '&radix=' + radix + '&name=' + name, true);
   xmlhttp.send();
  
}


//------------------------------------------------------------------------------
// Funktion set_modal
// Blendet ein Dialogfenster (Modal) für die Eingabe eines neuen radix ein.
//------------------------------------------------------------------------------
function set_modal () {
   //Dialog Fenster (Modal)
   var modflag = sessionStorage.getItem('modal');
   var modal = document.getElementById('neuradix');
   var btn = document.getElementById("new");
   var span = document.getElementsByClassName("close")[0];
   var ort = sessionStorage.getItem('ort');
   var gname = document.getElementById('getname');
   var rxval = document.getElementById('dst').innerHTML.split(' ');
   var x = rxval[0].split('.');
   if(x[0] < 10) { x[0] = "0"+ x[0]; }
   if(x[1] < 10) { x[1] = "0"+ x[1]; }
   var engdate = x[2] + "-" + x[1] + "-" + x[0];

   if (radix == 1 && modflag == 0) {
      document.nf.name.value = sessionStorage.getItem('name');
      console.log ("DEBUG: engdate: " + engdate);
      document.nf.datum.value = engdate;
      document.nf.uhrzeit.value = rxval[1];
      document.nf.ort.value = ort;
      document.nf.long.value = rxval[3];
      document.nf.lat.value = rxval[4];
   }

   // Wenn der N Button gedrückt wird - Dialogfenster öffnen
     btn.onclick = function() {
     modal.style.display = "block";
     gname.focus();
     sessionStorage.setItem('modal', 1);
   }

   // X - Dialog schliessen
   span.onclick = function() {
     modal.style.display = "none";
     sessionStorage.setItem('modal', 0);
   }

   // Dialog schliessen, wenn ausserhalb des Dialogfensters geklickt wird
   window.onclick = function(event) {
      if (event.target == modal) {
      modal.style.display = "none";
      sessionStorage.setItem('modal', 0); 
      } 
   }
}


//------------------------------------------------------------------------------
// Funktion show_tb
// Blendet ein Dialogfenster (Modal) für die Anzeige eines Hinweistextes 
// für einen Aspekt ein. Dabei wird über einen XHR das entsprechende Textfile
// auf dem Server eingelesen und in den Modal eingeblendet.
//------------------------------------------------------------------------------
function show_tb (asp) {
   var transit = sessionStorage.getItem('transit');   
   //Textbox (Modal)
   var modal_tb = document.getElementById('tebo');
   var span = document.getElementsByClassName("close_tb")[0];
   var textara = document.getElementById('tbi');
   textara.value = "";
   var txtfile = asp + ".txt";
   modal_tb.style.display = "block";

   // X - Dialog schliessen
   span.onclick = function() {
     modal_tb.style.display = "none";
   }
   // Dialog schliessen, wenn ausserhalb des Dialogfensters geklickt wird
   window.onclick = function(event) {
      if (event.target == modal_tb) {
        modal_tb.style.display = "none";
      } 
   }
   // xhr request
   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("tbi").innerHTML=xmlhttp.responseText;
         load_listener ();
         //set_modal();
      }
   }
   //xmlhttp.open("GET", 'texte/' + txtfile, true);
   xmlhttp.open("GET", 'jaap.pl?transit=' + transit + '&hinweis=' + asp);
   xmlhttp.send();
}



//------------------------------------------------------------------------------
// Funktion openmenue
//------------------------------------------------------------------------------
function openmenue () {
    var drdo = document.getElementById("dropdown");
    drdo.classList.toggle("show");

    // Dialog schliessen
    drdo.onclick = function() {
       drdo.classList.toggle ("show");
    }
}


//------------------------------------------------------------------------------
// Funktion show_about
//------------------------------------------------------------------------------
function show_about() {

   var modal = document.getElementById('openabout');
   modal.style.display = "block";
}


//------------------------------------------------------------------------------
// Funktion submitform 
// Wenn ein Neues Radix eingegeben wird, wird durch das klicken auf OK 
// Ein Submit mit den Werten durchgeführt.
//------------------------------------------------------------------------------
function submitform () {
   var getname = document.getElementById('getname').value;
   var hsys = localStorage.getItem('hsys');
   var nForm = document.forms.nf;
   nForm.elements[8].value = hsys;
   sessionStorage.setItem('radix', 1);
   sessionStorage.setItem('name', getname);
   sessionStorage.setItem('transit', 0);
   sessionStorage.setItem('rxstr', '');
   //document.getElementById("newform").submit();
   nForm.submit();
}


//------------------------------------------------------------------------------
// Funktion searchlocation
// Wird bei der Radix Eingabe nach einem Ortsnamen gesucht, dann wird ein XHR
// Mit dem Ortsnamen durchgeführt. Das Ergebnis der Suche wird dann in das
// Listenfeld im Modal Dialog eingeblendet.
//------------------------------------------------------------------------------
function searchlocation() {
   var ortsname = document.getElementById('ortstr').value;
   if (ortsname == "") { return; }
   sessionStorage.setItem('ort', ortsname);
   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         //document.getElementById("olist").innerHTML=xmlhttp.responseText;
         document.getElementById("olist").innerHTML=xmlhttp.responseText;
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?ortsname=' + ortsname, true);
   xmlhttp.send();
}



//------------------------------------------------------------------------------
// Funktion set_lola
// Wird ein Ort aus der Ergebnislister der Ortssuche angeklickt, dann werden
// Die Werte für Long und Lat in die Entprechenden Eingabefelder übertragen.
//------------------------------------------------------------------------------
function set_lola() {
   var list = document.getElementById('olist');
   var index = list.selectedIndex;
   var sel = list[index].value;
   var p1 = sel.split("[");
   var p2 =  p1[1].split("]");
   var ptr = p2[0].trim();
   var lola = ptr.split(" ");
   var ort = p2[1].split(",");

   document.getElementById('ortstr').value = ort[0].trim();   
   document.getElementById('long').value = lola[0];
   document.getElementById('lat').value = lola[1];

   sessionStorage.setItem('ort', ort[0].trim());
}


//------------------------------------------------------------------------------
// Funktion open_file
// Öffnet einen Filedialog und liest eine aaf Datei ein
//------------------------------------------------------------------------------
function import_aaf() {

   var input = document.createElement('input');
   var dstr, tstr, xlong, xlat, ortsname, abw, tc
   input.type = 'file';

   input.onchange = e => { 

      // file Referenz einlesen und speichern
      var file = e.target.files[0]; 

      // reader setzen
      var reader = new FileReader();
      reader.readAsText(file,'UTF-8');

      // verarbeiten der Werte
      reader.onload = readerEvent => {
         var content = readerEvent.target.result; // this is the content!
         var part = content.split(/\r?\n/);
         var part2, partA, partB, partZ, Name, zeit, line, date, time, timestr, utcd, utcdate, utctime, utcdatetime, x, tB1, tB2;
         var lines = new Array;
         var count = 0;
         var bcount = 0;
         var pLen = part.length;
       

         // Einlesen der #A93 Zeile 
         for (i = 0; i < pLen; i++) {
            if (part[i].indexOf("#A93") != -1) {
               bcount = 0;
               part[i] = part[i].replace(/(\r\n|\n|\r)/gm," ");
               line = part[i].slice(5);
               partA = line.split(",");
               ortsname = partA[5];
               if (partA[0] == "*") { partA[0] = ""; }
               if (partA[1] == "*") { partA[1] = ""; }
               name = (partA[0] + " " + partA[1]).trim();
               x = partA[4].split(":");
               zeit = x[0] + ":" + x[1];
               date = partA[3].split(".");
               time = zeit.split(":");
               if (time[0].indexOf("h")) {
                  x = time[0].replace("h", ":");
                  time[0] = x;
               }
            }

         // Einlesen der #B93 Zeile 
            if (part[i].indexOf("#B93") != -1 && bcount == 0) {
               bcount++;
               line = part[i].slice(5);
               partB = line.split(",");

               dstr = date[0] + "." + date[1] + "." + date[2];
               tstr = time[0] + "." + time[1];

               if (partB[1].indexOf(":")) { tB1 = partB[1].split(":"); }
               else { tB1[0] = $partB[1]; }
               if (partB[2].indexOf(":")) { tB2 = partB[2].split(":"); }
               else { tB2[0] = $partB[2]; }
               xlat = tB1[0].replace(/[ns]/i, ".");
               x = xlat.replace(/^(0+)/g, '');               
               xlat = x;
               xlong = tB2[0].replace(/[oe]/i, ".");
               x = xlong.replace(/^(0+)/g, '');               
               xlong = x;
	       tc = partB[3];

               lines[count++] = name + ";" + dstr + ";" + tstr + ";" + xlong + ";" + xlat + ";" + ortsname + ";" + tc;
            }

         // Einlesen der #ZNAM Zeile 
         //   if (part[i].indexOf("#ZNAM") != -1) {
	 //      partZ = part[i].split(":");
	 //      abw = partZ[1];
         //   }

	
         }
         lines.forEach(function(linesElement) {
	    jaap_db("w", linesElement);
	 });

	 var dasa = "Datensätze";
	 if (lines.length < 2) { dasa = "Datensatz"; }
	 alert(lines.length + " " + dasa + " importiert");
      }
   }
   input.click();
}

//------------------------------------------------------------------------------
// Funktion set_open
// Einblenden eines Modal Dialogs mit der Liste der gefunden Einträge aus dem aaf
//------------------------------------------------------------------------------
function set_open () {

   var modal = document.getElementById('openradix');
   var span = document.getElementsByClassName("close_open")[0];
   var count = 0;
   var entr = new Array();
   db_str = "";

   jaap_db("r");

   setTimeout(function() {
      entr = db_str.split(",");

      modal.style.display = "block";

      // X - Dialog schliessen
      span.onclick = function() {
         modal.style.display = "none";
      }

      var selectElement = document.getElementById('llist');


      entr.forEach(function(entrElement) { 
         var option = new Option(entrElement);
         selectElement.options[count] = option;
         count++;
      });	   
   }, 200);
}


//------------------------------------------------------------------------------
// Funktion set_load
// Wird ein Eintrag aus der "open File" Ergebnisliste angeklickt, wird mit
// diesen Werten ein XHR durchgeführt. Als Ergebnis kommt das entsprechende Radix
//------------------------------------------------------------------------------
function set_load (){

   var list = document.getElementById('llist');
   var index = list.selectedIndex;
   var sel = list[index].innerHTML;
   var part = sel.split(";");
   var name = part[0].replace(" ","%20");
   var hsys = localStorage.getItem('hsys');
   sessionStorage.setItem('ort', part[5]);

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         radix = 1;
         sessionStorage.setItem('radix', 1);
         var rname = document.getElementById("rmode").innerHTML;
         sessionStorage.setItem('name', rname);
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?radix=1&name=' + name + '&datum=' + part[1] + '&uhrzeit=' + part[2] + '&long=' + part[3] + '&lat=' + part[4] + '&hsys=' + hsys, true);
   xmlhttp.send();

   console.log (sel);
}


//------------------------------------------------------------------------------
// Funktion close_about
// schliesst das about Dialogfenster
//------------------------------------------------------------------------------
function close_about() {
   var modal = document.getElementById('openabout');
   modal.style.display = "none";
}


//------------------------------------------------------------------------------
// Funktion reset
// Wird der ! Button oder esc gedrückt, wird ein XHR ohne Datum durchgeführt
// Als Ergebnis kommt wieder das Horoskop mit dem aktuellen Datum.
// Im Transit Modus wird auch das Radix erneut gesendet
//------------------------------------------------------------------------------
function reset () {
   if (radix == 1) {
      sessionStorage.setItem('rxstr', '');
      sessionStorage.setItem('name', '');
      sessionStorage.setItem('ort', '');
   }
   sessionStorage.setItem('radix', 0);
   radix = 0;
   var hsys = localStorage.getItem('hsys');
   if (!hsys) {
      hsys = 'Placidus';
      localStorage.setItem('hsys', 'Placidus');
   }
   var trmode = sessionStorage.getItem('transit');
   var planet = sessionStorage.getItem('planet');
   var dst = localStorage.getItem('home').split(" ");
   var rxstr = "";
   if (trmode == 1) { rxstr = sessionStorage.getItem('rxstr'); }
 
   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         load_listener ();
         set_modal();
	 chk_version();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?dstr=' + rxstr + '&filter=' + planet + '&hsys=' + hsys + '&transit=' + trmode + '&hlo=' + dst[0] + '&hla=' + dst[1], true);
   xmlhttp.send();
} 


//------------------------------------------------------------------------------
// Funktion save
// Speichert ein Horoskop in die Datenbank
//------------------------------------------------------------------------------
function save() {
   var ort = sessionStorage.getItem('ort');

   var tzi = document.getElementById("tzi").innerHTML;
   var zz = tzi.split(" ");
   var abwg = zz[1].replace(/\(|\)/g,"");
   var ew;
   if (abwg.charAt(0) == "+") { ew = "he"; }
   if (abwg.charAt(0) == "-") { ew = "hw"; }
   abwg = abwg.replace(/\+|\-/g,"");
   var hours = abwg.substring(0,2);
   var mins = abwg.substring(2);

   var dst = document.getElementById("dst").innerHTML;
   var dt = dst.split(" ");
   var name = "";
   var pr = 0;
   if (document.getElementById("rmode") !== null) {
      name = document.getElementById("rmode").innerHTML;
   }
   else {
      name = prompt("Bitte einen Namen eingeben...", "");
      pr = 1;
      if (name == "") {
	 name = dt[0] + "_" + dt[1];
         name = name.replace(/:/g,'');
         name = name.replace(/\./g,'');
      }
   }
    
   var str = name + ";" + dt[0] + ";" + dt[1] + ";" + dt[3] + ";" + dt[4] + ";" + ort + ";" + hours + ew + mins + ";" + dt[2];
   //console.log (str);
   jaap_db("w", str);
   if (pr == 0) { alert ("Horoskop wurde gespeichert"); }
}

//------------------------------------------------------------------------------
// Funktion export
// Speichert die Horoskope aus der Datenbank in eine aaf Datei
//------------------------------------------------------------------------------
function export_db() {
   db_str = "";
   var ns, ew, lon, lat;
   var dt = new Date();
   let month = "" + (dt.getMonth() + 1);
   let day = "" + dt.getDate();
   let year = dt.getFullYear();
   if (month.length < 2) month = "0" + month;
   if (day.length < 2) day = "0" + day;
   let dateF = [day, month, year].join(".");
   let hour = "" + dt.getHours();
   let minute = "" + dt.getMinutes();
   if (minute.length < 2) minute = "0" + minute;
   let timeF = [hour, minute].join(":");
   var text = "#:=== Jaap " + version + " - AAF Export vom " + dateF + " " + timeF + " ===\r\n\r\n";


   jaap_db("r");
   setTimeout(function() {
      entr = db_str.split(",");
      entr.forEach(function(entrElement) { 
	 if (entrElement != "") {
            p = entrElement.split(";");
            if (p[4] < 0) { ns = "s"; }
            else { ns = "n"; }
            lat = p[4].replace(/\./,ns);
            if (p[3] < 0) { ew = "w"; }
            else { ew = "e"; }
            lon = p[3].replace(/\./,ew);

            text += "#A93:" + p[0] + ",*,*," + p[1] + "," + p[2] + "," + p[5] + ",*\r\n";
	    text += "#B93:*," + lat + "," + lon + "," + p[6] + ",*\r\n";
	    text += "#ZNAM:" + p[7] + "\r\n";
	    text += "#COM:\r\n";
         }
      });	   

      //console.log(text);
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', "jaap.aaf");

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

   }, 200);
}

//------------------------------------------------------------------------------
// Funktion jaap_db
// Datenbank für die gespeicherten Horoskope und die Hinweistexte
//------------------------------------------------------------------------------
function jaap_db (rw, str) {
   var obj = new Array();
   var all;
   var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

   const openRequest = indexedDB.open("jaapDB", 1);

   openRequest.onupgradeneeded = e => {
      const db = e.target.result;
      db.createObjectStore('radix', { autoIncrement: true });
   }

      openRequest.onsuccess = e => {
      const db = e.target.result;    
    
      const transaction = db.transaction('radix', 'readwrite');
      const radixStore = transaction.objectStore('radix');

      if (rw == "w") {
         radixStore.put(str);
	 return 1;
      }
      else if (rw == "r") {
         all = radixStore.getAll();
	 all.onsuccess = function() {
            obj = (all.result);
            obj.forEach(function(obj){
	       db_str += obj + ",";
            });
         };
	 db_str = db_str.replace(/,\s*$/, "");
      }

      // Close the db when the transaction is done
      transaction.oncomplete = function() {
	 console.log("closing DB");
         db.close();
      };
   }
}


