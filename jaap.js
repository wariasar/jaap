/*
------------------------------------------------------------------------------
 jaap.js

 Astrologie Programm

 Copyright (C) 2019-2023  Armin Warias

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

var version = "alpha 0.0.35.5";
var test_modus = document.getElementById("info").innerHTML;
const isMobile = check_mobile();
var radix = 0;
var transit = 0;
var load = 0;
var radixn = 0;
var smart = 0;
var hcgi;
var db_str = "";
var create_new = 0;
sessionStorage.setItem('modal', 0);

// prüfen ob mobil device
var chkor = localStorage.getItem('override');
if (chkor != 1) {
   if (isMobile) {	
      localStorage.setItem('smart', 1);
      smart = 1;
   } else {
      localStorage.setItem('smart', 0);
      smart = 0;
   }
}

// prüfen ob radix
if (test_modus == "radix") {
   radix = 1;
   sessionStorage.setItem('radix', 1);	
   var rname = document.getElementById("rmode").innerHTML;
   sessionStorage.setItem('name', rname);
} 

//prüfen ob ein home long und lat gesetzt ist, wenn ja im localStorage speichern
if (radix == 0) {
   sessionStorage.setItem('notime', 0);
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
}


//------------------------------------------------------------------------------
// Funktion set_home_loc()
// setzt die home location
//------------------------------------------------------------------------------
function set_home_loc() {
   var lostr = document.querySelector("#long").value;
   var lastr = document.querySelector("#lat").value;
   //var urlstr = window.location.href + "?hlo=" + lostr + "&hla=" + lastr;
   //window.open(urlstr,"_top");
   //console.log (urlstr);
   localStorage.setItem("home", lostr + " " + lastr);
   sessionStorage.setItem("modal", 0);
   reset();
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
      multi.onchange = function() {
	      sessionStorage.setItem('multi', multi.value);
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
      load = 0;
      radixn = 0;
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

   if (load == 1 && evt.keyCode == 13) { set_load(); }
   if (radixn == 1 && evt.keyCode == 13) {
      //var dummyEl = document.getElementById('olist');
      var dummySB = document.getElementById('sb');
      if (document.activeElement !== dummySB) {
         newradix();
      }
   }

   if (sessionStorage.getItem('modal') == 0) {
      if (evt.keyCode == 48) { setval('offset', 'Jahr', 'offset'); setval('mult', 100, 'multi'); } //0
      if (evt.keyCode == 49) { setval('offset', 'Minute', 'offset'); setval('mult', 1, 'multi'); } //1
      if (evt.keyCode == 50) { setval('offset', 'Minute', 'offset'); setval('mult', 10, 'multi'); } //2
      if (evt.keyCode == 51) { setval('offset', 'Stunde', 'offset'); setval('mult', 1, 'multi'); } //3
      if (evt.keyCode == 52) { setval('offset', 'Tag', 'offset'); setval('mult', 1, 'multi');} //4
      if (evt.keyCode == 53) { setval('offset', 'Woche', 'offset'); setval('mult', 1, 'multi'); } //5
      if (evt.keyCode == 54) { setval('offset', 'Monat', 'offset'); setval('mult', 1, 'multi'); } //6
      if (evt.keyCode == 55) { setval('offset', 'Jahr', 'offset'); setval('mult', 1, 'multi'); } //7
      if (evt.keyCode == 56) { setval('offset', 'Jahr', 'offset'); setval('mult', 5, 'multi'); } //8
      if (evt.keyCode == 57) { setval('offset', 'Jahr', 'offset'); setval('mult', 10, 'multi'); } //9
      if (evt.keyCode == 33 || evt.keyCode == 173) { if (radix == 0 || transit == 1) { set_offs("minus"); }} //PG up (-)
      if (evt.keyCode == 34 || evt.keyCode == 171) { if (radix == 0 || transit == 1) { set_offs("plus"); }}  //PG down (+)
      if (evt.keyCode == 76) { set_open(); } //L (load radix)
      if (evt.keyCode == 35) { set("Alle"); } //ende
      if (evt.keyCode == 36) { reset(); } //pos1
      //if (evt.keyCode == 77) { openmenue(); } //M
      if (evt.keyCode == 77) { set('Moon'); } //M
      if (evt.keyCode == 83) { set('Sun'); } //S
      if (evt.keyCode == 86) { set('Venus'); } //V
      if (evt.keyCode == 69) { set('Mercury'); } //E
      if (evt.keyCode == 65) { set('Mars'); } //A
      if (evt.keyCode == 85) { set('Saturn'); } //U
      if (evt.keyCode == 80) { set('Pluto'); } //P
      if (evt.keyCode == 74) { set('Jupiter'); } //J
      if (evt.keyCode == 81) { set('Uranus'); } //Q
      if (evt.keyCode == 87) { set('Neptune'); } //W
      if (evt.keyCode == 32) { set('Alle'); } //space
      if (evt.keyCode == 88) { document.getElementById("planets").focus(); } //X
   }
}

function TasteLosgelassen(evt) {
   if (sessionStorage.getItem('modal') == 0) {
      if (evt.keyCode == 78) { //N (new radix)
         document.getElementById('neuradix').style.display = "block"; 
         document.getElementById('getname').focus(); 
	 modal = 1;
         radixn = 1;
         sessionStorage.setItem('modal', 1);
      } 
   }

}

function smart_n () {
   if (sessionStorage.getItem('modal') == 0) {
      document.getElementById('neuradix').style.display = "block"; 
      document.getElementById('getname').focus(); 
      modal = 1;
      radixn = 1;
      sessionStorage.setItem('modal', 1);
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
   smart = localStorage.getItem('smart');
   var datestr = document.getElementById("dst").innerHTML;
   var multi = sessionStorage.getItem('multi');
   var hsys;
   if (sessionStorage.getItem('notime') == 0) {
      hsys = localStorage.getItem('hsys');
   } else {
      hsys = 'Keine';
   }
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
   xmlhttp.open("GET", 'jaap.pl?dstr=' + datestr + '&dstr_tr=' + datestr_tr + '&filter=' + planet + '&multi=' + multi + '&hsys=' + hsys + '&radix=' + radix + '&name=' + name + '&transit=' + trmode + '&smart=' + smart, true);
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
   smart = localStorage.getItem('smart');
   var offs = sessionStorage.getItem('offset');
   var planet = sessionStorage.getItem('planet');
   var multi = sessionStorage.getItem('multi');
   var hsys;
   if (sessionStorage.getItem('notime') == 0) {
      hsys = localStorage.getItem('hsys');
   } else {
      hsys = 'Keine';
   }
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
   xmlhttp.open("GET", 'jaap.pl?dstr=' + datestr + '&dstr_tr=' + datestr_tr + '&offset=' + offs + '&op=' + op + '&filter=' + planet + '&multi=' + multi + '&hsys=' + hsys + '&transit=' + trmode  + '&hlo=' + dst[0] + '&hla=' + dst[1] + '&smart=' + smart, true);
   xmlhttp.send();
}


//------------------------------------------------------------------------------
// Funktion set_transit
// Wenn die Transit Funktion gewählt wird, wird das Aktuelle radix im sessionStorage
// gespeichert. Anschliessend wird ein neuer XHR mit dem Aktuellen Datum und dem
// Radix durchgeführt. Als Ergebnis kommt das Transit Horoskop.
//------------------------------------------------------------------------------
function set_transit () {
   smart = localStorage.getItem('smart');
   var rxstr = document.getElementById('dst').innerHTML;
   var dst = localStorage.getItem('home').split(" ");
   var hsys;
   if (sessionStorage.getItem('notime') == 0) {
      hsys = localStorage.getItem('hsys');
   } else {
      hsys = 'Keine';
   }
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
   xmlhttp.open("GET", 'jaap.pl?transit=1' + '&dstr=' + rxstr + '&hlo=' + dst[0] + '&hla=' + dst[1] + '&hsys=' + hsys + '&smart=' + smart);
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
   transit = 0;
   smart = localStorage.getItem('smart');
   var datestr = sessionStorage.getItem('rxstr');
   var hsys;
   if (sessionStorage.getItem('notime') == 0) {
      hsys = localStorage.getItem('hsys');
   } else {
      hsys = 'Keine';
   }
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
   xmlhttp.open("GET", 'jaap.pl?dstr=' + datestr + '&hsys=' + hsys + '&radix=' + radix + '&name=' + name + '&smart=' + smart, true);
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
   var rxval;
   if (transit == 0) {
      rxval = document.getElementById('dst').innerHTML.split(' ');
   }
   if (transit == 1) {
      rxval = sessionStorage.getItem('rxstr').split(' ');
   }

   var x = rxval[0].split('.');
   if (x[2] <= 0) {
      x[2] = x[2].replace(/-/,"");
      x[2] = parseInt(x[2]) + 1;
      document.getElementById('vchr').checked = true;
   }	   
   x[2] = ("0000" + x[2]).slice(-4);
   if(x[0] < 10) { x[0] = "0"+ x[0]; }
   if(x[1] < 10) { x[1] = "0"+ x[1]; }
   var engdate = x[2] + "-" + x[1] + "-" + x[0];

   if ((radix == 1 || transit == 1) && modflag == 0) {
      document.getElementById('getname').value = sessionStorage.getItem('name');
      document.getElementById('getdate').value = engdate;
      if (rxval[1].length == 4) { rxval[1] = "0" + rxval[1]; }
      document.getElementById('gettime').value = rxval[1];
      document.getElementById('ortstr').value = ort;
      document.getElementById('long').value = rxval[3];
      document.getElementById('lat').value = rxval[4];
   }

   // Wenn der N Button gedrückt wird - Dialogfenster öffnen
     btn.onclick = function() {
     modal.style.display = "block";
     gname.focus();
     sessionStorage.setItem('modal', 1);
     radixn = 1;
   }

   // X - Dialog schliessen
   span.onclick = function() {
      modal.style.display = "none";
      sessionStorage.setItem('modal', 0);
      radixn = 0;
   }

   // Dialog schliessen, wenn ausserhalb des Dialogfensters geklickt wird
   window.onclick = function(event) {
      if (event.target == modal) {
      modal.style.display = "none";
      sessionStorage.setItem('modal', 0); 
      radixn = 0;
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
   smart = localStorage.getItem('smart');
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
   xmlhttp.open("GET", 'jaap.pl?transit=' + transit + '&hinweis=' + asp, + '&smart=' + smart);
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
   if (nForm.elements[3].value == "") {
      sessionStorage.setItem('notime', 1);
   } else {
      sessionStorage.setItem('notime', 0);
   } 
   sessionStorage.setItem('radix', 1);
   sessionStorage.setItem('name', getname);
   sessionStorage.setItem('transit', 0);
   sessionStorage.setItem('rxstr', '');
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
         var count = -1;
         var bcount = 0;
         var pLen = part.length;
       

         for (i = 0; i < pLen; i++) {
            // Einlesen der #A93 Zeile 
            if (part[i].indexOf("#A93") != -1) {
	       count++;
               bcount = 0;
               part[i] = part[i].replace(/(\r\n|\n|\r)/gm," ");
               line = part[i].slice(5);
               partA = line.split(",");
               ortsname = partA[5];
               if (partA[0] == "*") { partA[0] = ""; }
               if (partA[1] == "*") { partA[1] = ""; }
               name = (partA[0] + " " + partA[1]).trim();
	       if (partA[4] != "*") {
                  x = partA[4].split(":");
                  zeit = x[0] + ":" + x[1];
	       }
	       else { zeit = "*"; }
               date = partA[3].split(".");
               if (zeit != "*") {
	          time = zeit.split(":");
                  if (time[0].indexOf("h")) {
                     x = time[0].replace("h", ":");
                    time[0] = x;
	          }
               }
            }

            // Einlesen der #B93 Zeile 
            if (part[i].indexOf("#B93") != -1 && bcount == 0) {
               bcount++;
               line = part[i].slice(5);
               partB = line.split(",");

               dstr = date[0] + "." + date[1] + "." + date[2];
               if (zeit != "*") { tstr = time[0] + ":" + time[1]; }
	       else { tstr = "*"; }

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

               lines[count] = name + ";" + dstr + ";" + tstr + ";" + xlong + ";" + xlat + ";" + ortsname + ";" + tc;
            }

            // Einlesen der #ZNAM Zeile 
            if (part[i].indexOf("#ZNAM") != -1) {
	       partZ = part[i].split(":");
	       abw = partZ[1];
	       
	       lines[count] += ";" + abw;
            }
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
// Einblenden eines Modal Dialogs mit der Liste der gefunden Einträge aus der Datenbank
//------------------------------------------------------------------------------
function set_open () {

   radixn = 0;
   var modal = document.getElementById('openradix');
   var span = document.getElementsByClassName("close_open")[0];
   var count = 0;
   var entr = new Array();
   db_str = "";

   jaap_db("r")
   .then(() => {
      entr = db_str.split(",");

      modal.style.display = "block";
      sessionStorage.setItem('modal', 1);
      load = 1;

      // X - Dialog schliessen
      span.onclick = function() {
         modal.style.display = "none";
         sessionStorage.setItem('modal', 0);
	 load = 0;
      }

      var selectElement = document.getElementById('llist');


      entr.forEach(function(entrElement) { 
	 if (entrElement != "") {
            var option = new Option(entrElement);
            selectElement.options[count] = option;
            count++;
         }
      });	   
      document.getElementById('llist').focus();
   })
}


//------------------------------------------------------------------------------
// Funktion newradix
// Führt einen XHR mit den Werten des Eingabeformulars für ein neues Radix durch
//------------------------------------------------------------------------------
function newradix() {
   smart = localStorage.getItem('smart');
   var name = document.getElementById('getname').value;
   var date = document.getElementById('getdate').value;
   var time = document.getElementById('gettime').value;
   var ort = document.getElementById('ortstr').value;
   var lon = document.getElementById('long').value;
   var lat = document.getElementById('lat').value;
   var hsys = localStorage.getItem('hsys');
   var bc = document.getElementById('vchr');
   var miss = 0;
   var message1 = "Bitte die markierten Felder Ausfüllen";
   var message2 = "Bitte die markierten Felder Ausfüllen oder einen Ort aus der Liste Auswählen";
   var message3 = "Bitte für Long und Lat eine Zahl eintragen oder einen Ort aus der Liste Auswählen";
  

   // Die Felder Datum, Long und Lat müssen ausgefüllt sein
   document.getElementById('long').style.backgroundColor = "";
   lon = lon.replace(/,/,".");
   if (isNaN(lon) || lon == "") {
      document.getElementById('long').style.backgroundColor = "#fdcccc";
      miss = 1;	   
   }
   document.getElementById('lat').style.backgroundColor = "";
   lat = lat.replace(/,/,".");
   if (isNaN(lat) || lat == "") {
      document.getElementById('lat').style.backgroundColor = "#fdcccc";
      miss = 1;	   
   }
   document.getElementById('getdate').style.backgroundColor = "";
   if (!date) {
      document.getElementById('getdate').style.backgroundColor = "#fdcccc";
      miss = 1;	   
   }

   // Ein erforderliches Feld fehlt oder hat einen ungültigen Wert	
   if (miss) {
      if (date && lon == "" && lat == "") {
          document.getElementById('miss').innerHTML = message2;
      }
      else if ((isNaN(lon) && lon != "") || (isNaN(lat) && lat != "")) {
          document.getElementById('miss').innerHTML = message3;
      }
      else {
          document.getElementById('miss').innerHTML = message1; 
      }
      return;
   }

   // range für Long und Lat darf nicht über/unterschritten werden	
   if (lon < -180) { lon = -180; }
   if (lon > 180) { lon = 180; }
   if (lat < -90) { lat = -90; }
   if (lat > 90) { lat = 90; }

   // Auf 2 Nachkommastellen runden
   lon = Number(lon).toFixed(2);
   lat = Number(lat).toFixed(2);

   // Bei fehlender Uhrzeit wird das Radix ohne Häuser angezeigt
   if (time == "") { sessionStorage.setItem('notime', 1); }
   else { sessionStorage.setItem('notime', 0); }

   if (bc.checked) {
      if (time == "") { time = "bc"; }
      else { time += " bc"; }
   }

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         radix = 1;
         sessionStorage.setItem('radix', 1);
         transit = 0;
         sessionStorage.setItem('transit', 0);
	 modal = 0;
         sessionStorage.setItem('modal', 0);
         var rname = document.getElementById("rmode").innerHTML;
         sessionStorage.setItem('name', rname);
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?radix=1&name=' + name + '&datum=' + date + '&uhrzeit=' + time + '&long=' + lon + '&lat=' + lat + '&hsys=' + hsys + '&smart=' + smart, true);
   xmlhttp.send();


}


//------------------------------------------------------------------------------
// Funktion set_load
// Wird ein Eintrag aus der "open File" Ergebnisliste angeklickt, wird mit
// diesen Werten ein XHR durchgeführt. Als Ergebnis kommt das entsprechende Radix
//------------------------------------------------------------------------------
function set_load (){

   smart = localStorage.getItem('smart');
   var list = document.getElementById('llist');
   var index = list.selectedIndex;
   var sel = list[index].innerHTML;
   var part = sel.split(";");
   var hsys;
   if (part[2] == "*") {
      part[2] = "12:00";
      sessionStorage.setItem('notime', 1);
      hsys = 'Keine';
   } else {
      hsys = localStorage.getItem('hsys');
      sessionStorage.setItem('notime', 0);
   }
   var name = part[0].replace(" ","%20");
   sessionStorage.setItem('ort', part[5]);
   sessionStorage.setItem('modal', 0);
   load = 0;

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
   xmlhttp.open("GET", 'jaap.pl?radix=1&name=' + name + '&datum=' + part[1] + '&uhrzeit=' + part[2] + '&long=' + part[3] + '&lat=' + part[4] + '&hsys=' + hsys + '&smart=' + smart, true);
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
// Funktion smart_or
// Manuelles setzten ses Smart Modus
//------------------------------------------------------------------------------
function smart_or() {
   var smor;
   if (smart == 0) {
      smart = 1;
      localStorage.setItem('smart', 1);
      localStorage.setItem('override', 1);
      reset();
      return;
   }  
   if (smart == 1) {
      smart = 0;
      localStorage.setItem('smart', 0);
      localStorage.setItem('override', 1);
      reset();
      return;
   }  
}

//------------------------------------------------------------------------------
// Funktion reset
// Wird der ! Button oder esc gedrückt, wird ein XHR ohne Datum durchgeführt
// Als Ergebnis kommt wieder das Horoskop mit dem aktuellen Datum.
// Im Transit Modus wird auch das Radix erneut gesendet
//------------------------------------------------------------------------------
function reset () {
   smart = localStorage.getItem('smart');
   if (radix == 1) {
      sessionStorage.setItem('rxstr', '');
      sessionStorage.setItem('name', '');
      sessionStorage.setItem('ort', '');
   }
   if (transit == 0 || radix == 1) {
      sessionStorage.setItem('notime', 0);
   }
   sessionStorage.setItem('radix', 0);
   radix = 0;
   var hsys;
   if (sessionStorage.getItem('notime') == 0) {
      hsys = localStorage.getItem('hsys');
   } else {
      hsys = 'Keine';
   }
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
   xmlhttp.open("GET", 'jaap.pl?dstr=' + rxstr + '&filter=' + planet + '&hsys=' + hsys + '&transit=' + trmode + '&hlo=' + dst[0] + '&hla=' + dst[1] + '&smart=' + smart, true);
   xmlhttp.send();
} 


//------------------------------------------------------------------------------
// Funktion save
// Speichert ein Horoskop in die Datenbank
//------------------------------------------------------------------------------
function save() {
   var ort = sessionStorage.getItem('ort');
   var notime = sessionStorage.getItem('notime');

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
   
   if (notime == 1) { dt[1] = "*"; }
   if (name != null) {
      var str = name + ";" + dt[0] + ";" + dt[1] + ";" + dt[3] + ";" + dt[4] + ";" + ort + ";" + hours + ew + mins + ";" + dt[2];
      //console.log (str);
      jaap_db("w", str);
      if (pr == 0) { alert ("Horoskop wurde gespeichert"); }
   }
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


   jaap_db("r")
   .then(() => {
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

   });
}

//------------------------------------------------------------------------------
// Funktion jaap_db
// Datenbank für die gespeicherten Horoskope und die Hinweistexte
//------------------------------------------------------------------------------
function jaap_db (rw, str) {
   return new Promise((resolve, reject) => {
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
	    //console.log("closing DB");
            db.close();
            resolve();
         };
      }
   })
}



//------------------------------------------------------------------------------
// Funktion delete_all_data
// löscht alle von jaap gespeicherten Daten 
//------------------------------------------------------------------------------
function delete_all_data () {

   var check = confirm('Sollen alle von Jaap gespeicherten Daten gelöscht werden?'); 
   if (check == true) {
      //reset();
      var req = indexedDB.deleteDatabase("jaapDB");
      req.onsuccess = function () {
         console.log("Datenbank erfolgreich gelöscht");
	 alert("Daten wurden gelöscht.");
      };
      req.onerror = function () {
         console.log("Datenbank konnte nicht gelöscht werden");
         alert("Datenbank konnte nicht gelöscht werden");
      };
      req.onblocked = function () {
         console.log("Datenbank konnte nicht gelöscht werden, weil der Vorgang geblockt wurde");
         alert("Datenbank konnte nicht gelöscht werden, weil der Vorgang geblockt wurde");
      };

      localStorage.clear();
      sessionStorage.clear();
   }
}



//------------------------------------------------------------------------------
// Funktion check_mobile
// Prüft ob ein mobile device verwendet wird
//------------------------------------------------------------------------------
function check_mobile() {

  let check = false;

(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);

   return check;
}	

