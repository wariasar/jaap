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

var test_modus = document.getElementById("info").innerHTML;
var radix = 0;
var transit = 0;
document.cookie = "modal=0";

if (test_modus == "radix") {
   radix = 1;
   document.cookie = "radix=1";
   var rname = document.getElementById("rmode").innerHTML;
   document.cookie = "name=" + rname;
} 

//prüfen ob ein home long und lat gesetzt ist, wenn ja cookie setzen
if (radix == 0) {
   document.cookie = "home=11.08 49.45";
   if (document.getElementById("homecgi").innerHTML) { 
      var hcgi = document.getElementById("homecgi").innerHTML;
      document.cookie = "home=" + hcgi;
   }
}

function show_tz() {
   var tzi = document.getElementById("tzi").innerHTML;
   document.getElementById("info").innerHTML = tzi;
}

function set_date() {
   set("Alle");
}


//------------------------------------------------------------------------------
// listener laden
//------------------------------------------------------------------------------
load_listener();
set_modal();



//------------------------------------------------------------------------------
//values der listboxen manipulieren
//------------------------------------------------------------------------------
function setval(id, value, cookie) {    
    let element = document.getElementById(id);
    element.value = value;
    document.cookie = cookie +"="+ value;
}

if (radix == 0) {
   //default Werte setzen
   document.cookie = "planet=Alle";
   document.cookie = "offset=Stunde";
   document.cookie = "multi=1";
   document.cookie = "radix=0";
   document.cookie = "transit=0";
   document.cookie = "rxstr=";
   document.cookie = "name=";
}

// Es gibt kein entkommen du musst auf ok klicken (wegen den bösen cookies)
var irrenhaus = get_cookie("irrenhaus");
if (irrenhaus == 0) { show_about(); }

//Häuser auswahl disable wenn keine Uhrzeit
var dstr = document.getElementById("dst").innerHTML.split(" ");
if (dstr[1] == "") {
   document.getElementById('hsys').diable = true;
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
      document.cookie = "hsys=" + hsys.value;
      set (planets.value);
   }

   //Debug
   var dbg = document.getElementById("dbg").innerHTML;
   console.log (dbg);

   document.getElementById("txtform").reset();

   //Offset Listbox
   if (document.getElementById('offset') !== null) {
      var change_offset = document.getElementById('offset'); 
      change_offset.onchange = function() {
         document.getElementById("info").innerHTML = "set " + change_offset.value;
         document.cookie = "offset=" + change_offset.value;
      }
   }

   //Multiplikator Listbox
   if (document.getElementById('mult') !== null) {
      var multi = document.getElementById('mult');
      multi.onchange = function() {
         document.cookie = "multi=" + multi.value;
      }
   }
}

//------------------------------------------------------------------------------
//Tastatur Eingaben Abfangen
//------------------------------------------------------------------------------
var elem = document.getElementById('Seite');
elem.addEventListener("keydown", TasteGedrueckt );
elem.addEventListener("keyup", TasteLosgelassen);


function TasteGedrueckt (evt) {
   if (evt.keyCode == 33 || evt.keyCode == 173) { if (radix == 0 || transit == 1) { set_offs("minus"); }} //PG up (+)
   if (evt.keyCode == 34 || evt.keyCode == 171) { if (radix == 0 || transit == 1) { set_offs("plus"); }}  //PG down (-)
   if (evt.keyCode == 36) { if (radix == 0 || transit == 1) { reset(); }} //pos1
   //if (evt.keyCode == 36) { if (radix == 0) { location.reload(true); }}
   if (evt.keyCode == 35) { set("Alle"); } //ende
   if (evt.keyCode == 27) { set("Alle"); } //esc
   if (evt.keyCode == 84) { //t
     if (get_cookie("radix") == 1 && get_cookie("transit") == 0 && get_cookie("modal") == 0) { set_transit(); } 
   }
   if (evt.keyCode == 82) { //r
     if (get_cookie("transit") == 1 && get_cookie("modal") == 0) { restore_radix() } 
   }
   if (get_cookie("modal") == 0) {
      if (evt.keyCode == 49) { setval('offset', 'Minute', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 52) { setval('offset', 'Minute', 'offset'); setval('mult', 10, 'multi');}
      if (evt.keyCode == 50) { setval('offset', 'Stunde', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 51) { setval('offset', 'Tag', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 53) { setval('offset', 'Woche', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 54) { setval('offset', 'Monat', 'offset'); setval('mult', 1, 'multi'); }
      if (evt.keyCode == 55) { setval('offset', 'Monat', 'offset'); setval('mult', 12, 'multi'); }
   }
}

   function TasteLosgelassen(evt) {

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
   var multi = get_cookie("multi");
   var hsys = get_cookie("hsys");
   var radix = get_cookie("radix");
   var name = get_cookie("name");
   var trmode = get_cookie("transit");
   if (get_cookie("transit") == 1) {
      var datestr_tr = document.getElementById('dst').innerHTML;
      var datestr = get_cookie("rxstr");
      document.cookie = "radix=0";  
   }
   else {
      var datestr = document.getElementById('dst').innerHTML;
   }

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         document.cookie = "planet=" + planets.value;
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
   var multi = get_cookie("multi");
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
   var offs = get_cookie("offset");
   var planet = get_cookie("planet");
   var multi = get_cookie("multi");
   var hsys = get_cookie("hsys");
   var trmode = get_cookie("transit");
   var dst = get_cookie("home").split(" ");
   if (get_cookie("transit") == 1) { 
      var datestr_tr = document.getElementById('dst').innerHTML;
      var datestr = get_cookie("rxstr");
      document.cookie = "radix=0";
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
// Funktion get_cookie
// Liest den Wert eines gesetzten cookie
//------------------------------------------------------------------------------
function get_cookie (parameter) {
   var x = document.cookie.split(";");
   var i;
   for (i = 0; i < x.length; i++) {
      y = x[i].split("=");
      var par = y[0].trim();
      var val = y[1].trim();
      if (par == parameter) { return (val); }
   }
   return ("");
}


//------------------------------------------------------------------------------
// Funktion set_transit
// Wenn die Transit Funktion gewählt wird, wird das Aktuelle radix in ein cookie
// gespeichert. Anschliessend wird ein neuer XHR mit dem Aktuellen Datum und dem
// Radix durchgeführt. Als Ergebnis kommt das Transit Horoskop.
//------------------------------------------------------------------------------
function set_transit () {
   var rxstr = document.getElementById('dst').innerHTML;
   var dst = get_cookie("home").split(" ");
   document.cookie = "rxstr="+ rxstr; 
   document.cookie = "transit=1"; 
   document.cookie = "radix=0"; 
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
   xmlhttp.open("GET", 'jaap.pl?transit=1' + '&dstr=' + rxstr + '&hlo=' + dst[0] + '&hla=' + dst[1]);
   xmlhttp.send();

}


//------------------------------------------------------------------------------
// Funktion restore_radix
// Wenn vom Transit Horoskop wieder auf das Radix Horoskop gewechselt wird,
// lese ich das radix horoskop aus dem cookie ein und führe mit diesem einen
// XHR durch. Als Ergebnis kommt wieder das Radix Horoskop.
//------------------------------------------------------------------------------
function restore_radix() {
   document.cookie = "transit=0";
   var datestr = get_cookie("rxstr");
   var hsys = get_cookie("hsys");
   document.cookie = "radix=1";
   radix =1;
   var name = get_cookie("name");

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
   var modal = document.getElementById('neuradix');
   var btn = document.getElementById("new");
   var span = document.getElementsByClassName("close")[0];

   // Wenn der N Button gedrückt wird - Dialogfenster öffnen
     btn.onclick = function() {
     modal.style.display = "block";
     document.cookie = "modal=1";
   }

   // X - Dialog schliessen
   span.onclick = function() {
     modal.style.display = "none";
     document.cookie = "modal=0";
   }

   // Dialog schliessen, wenn ausserhalb des Dialogfensters geklickt wird
   window.onclick = function(event) {
      if (event.target == modal) {
      modal.style.display = "none";
      document.cookie = "modal=0"; 
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
   xmlhttp.open("GET", 'texte/' + txtfile, true);
   xmlhttp.send();
}



//------------------------------------------------------------------------------
// Funktion openmenue
//------------------------------------------------------------------------------
function openmenue () {
    document.getElementById("dropdown").classList.toggle("show");
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
   var hsys = get_cookie("hsys");
   var nForm = document.forms.nf;
   nForm.elements[8].value = hsys;
   document.cookie = "radix=1";
   document.cookie = "name=" + getname;
   document.cookie = "transit=0";
   document.cookie = "rxstr=";
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

   document.getElementById('ortstr').value = "";   
   document.getElementById('long').value = lola[0];
   document.getElementById('lat').value = lola[1];
}


//------------------------------------------------------------------------------
// Funktion open_file
// Öffnet einen Filedialog und liest eine aaf Datei ein
// Es wird dann ein Modal Dialog mit allen Einträgen eingeblendet
//------------------------------------------------------------------------------
function open_file() {

   var input = document.createElement('input');
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
         var part2, partA, partB, Name, zeit, line, date, time, timestr, utcd, utcdate, utctime, utcdatetime, x, tB1, tB2, xlong, xlat;
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

               var dstr = date[0] + "." + date[1] + "." + date[2];
               var tstr = time[0] + "." + time[1];

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
               
               //console.log (name + " " + utcdate + " " + utctime + " " + xlong + " " + xlat);
               lines[count++] = name + ";" + dstr + ";" + tstr + ";" + xlong + ";" + xlat;

            }
            if ( i == pLen-1) { set_open(lines); }
         }
      }
   }
   input.click();
}

//------------------------------------------------------------------------------
// Funktion set_open
// Einblenden eines Modal Dialogs mit der Liste der gefunden Einträge aus dem aaf
//------------------------------------------------------------------------------
function set_open (lines) {

   var modal = document.getElementById('openradix');
   var span = document.getElementsByClassName("close_open")[0];
   var count = 0;

   modal.style.display = "block";

   // X - Dialog schliessen
   span.onclick = function() {
     modal.style.display = "none";
   }


   var selectElement = document.getElementById('llist');

   lines.forEach(function(linesElement) { 
      var option = new Option(linesElement);
      selectElement.options[count] = option;
      count++;
   });

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
   var hsys = get_cookie("hsys");

   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         radix = 1;
         document.cookie = "radix=1";
         var rname = document.getElementById("rmode").innerHTML;
         document.cookie = "name=" + rname;
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?radix=1&name=' + name + '&datum=' + part[1] + '&uhrzeit=' + part[2] + '&long=' + part[3] + '&lat=' + part[4] + '&hsys=' + hsys, true);
   xmlhttp.send();

   console.log (sel);
}

//------------------------------------------------------------------------------
// Funktion cookie_agree
// Wenn der Browser neu gestartet wird, wird das cookie Dialogfenster eingeblendet,
// welches bestätigt werden muss (weil cookies so böse sind). Dann wird die
// Variable "irrenhaus" gesetzt und das Dialogfenster erscheint nicht mehr wieder
// bis der Browser das nächste mal beendet wird. dann werden alle meine cookies 
// wieder entfernt.
//------------------------------------------------------------------------------
function cookie_agree() {
   document.cookie = "irrenhaus=1";   
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
   document.cookie = "radix=0";
   radix = 0;
   var hsys = get_cookie("hsys");
   var trmode = get_cookie("transit");
   var planet = get_cookie("planet");
   var dst = get_cookie("home").split(" ");
   var rxstr = "";
   if (trmode == 1) { rxstr = get_cookie("rxstr"); }
 
   xmlhttp=new XMLHttpRequest();
   xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
         document.getElementById("Seite").innerHTML=xmlhttp.responseText;
         load_listener ();
         set_modal();
      }
   }
   xmlhttp.open("GET", 'jaap.pl?dstr=' + rxstr + '&filter=' + planet + '&hsys=' + hsys + '&transit=' + trmode + '&hlo=' + dst[0] + '&hla=' + dst[1], true);
   xmlhttp.send();
} 


//------------------------------------------------------------------------------
// Funktion save_file
// Speichert ein Horoskop in eine aaf Datei
// Die Funktion ist noch nicht ausreichend getestet
// Um zu verhindern dass evtl. eine aaf datei beschädigt wird ist die
// Funktion derzeit inaktiv
//------------------------------------------------------------------------------
function save_file() {
/*
   var name = document.getElementById("rmode").innerHTML;
   var dst = document.getElementById("dst").innerHTML;
   var tzi = document.getElementById("tzi").innerHTML;
   var dt = dst.split(" ");
   var p = tzi.split(" ");
   var offs = p[1].replace(/[()]/g,"");
   var ns;
   var ew;
   if (dt[4] < 0) { ns = "S"; }
   else { ns = "N"; }
   var lat = dt[4].replace(/\./,ns);
   if (dt[3] < 0) { ew = "W"; }
   else { ew = "E"; }
   var lon = dt[3].replace(/\./,ew);
    
   var text = "#A93:" + name + ",*,*," + dt[0] + "," + dt[1] + ",*,*\n#B93:*," + lat + "," + lon + "," + offs + ",*";
   var element = document.createElement('a');
   element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
   element.setAttribute('download', "jaap.aaf");

   element.style.display = 'none';
   document.body.appendChild(element);

   element.click();

   document.body.removeChild(element);
*/
}





