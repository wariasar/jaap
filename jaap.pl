#!/usr/bin/perl
#------------------------------------------------------------------------------
# jaap.pl
# Copyright (C) 2019-2021  Armin Warias
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.
#------------------------------------------------------------------------------

use strict;
use CGI;
use CGI::Carp qw(fatalsToBrowser);
use Math::Trig;
use Time::Local;
#use open IO => ':utf8';

my $version = "alpha 0.0.35";

my $template = "radix.svg";
my $css = "jaap.css";
my $js = "jaap.js";
my $ephedir = "/var/www/html/jaap/ephe";
my $swetest = "/var/www/html/jaap/src/swetest";

print "Content-type: text/html\n\n";

#------------------------------------------------------------------------------
# Einlesen und verarbeiten der CGI Parameter
#------------------------------------------------------------------------------
my $cgi = new CGI;
my @Feldnamen = $cgi->param();
my $home_long = "11.08";
my $home_lat = "49.45";
my ($string, $name, @p, @p2, @p3, @p4, $housesystem, $datestr, $pla, $hs, $hnr, @reldeg, $setdeg, $ret_date, $ret_date_tr, $ret_offs, $multi, $hsys, $op, $transpl, $style, $homecookie);
my (%rx, %tr);
my ($filter);
my $radix = 0;
my $transit = 0;
my $smart = 0;
my $ort = "";
my $hlo_set = 0;
my $hla_set = 0;
my $hlpl = "";
my $hlh = "";
my (%planets, %planets_tr, %houses, %planets_rel, %pl_h, @aspects, %rueckl, %rueckl_tr, %speed, %speed_tr, %force);
my @pl = ("Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Chiron", "Uranus", "Neptune", "Pluto", "true Node", "mean Apogee");
my %psym = ("Sun" => "☉", "Moon" => "☽", "Mercury" => "☿", "Ascendant" => "AC", "MC" => "MC",
            "Venus" => "♀", "Mars" => "♂", "Jupiter" => "♃",
            "Saturn" => "♄", "Uranus" => "⛢", "Neptune" => "♆" , "Pluto" => "♇", "true Node" => "☊", "Chiron" => "⚷", "mean Apogee" => "⚸");
my %hflag = ("Placidus" => "P", "Topozentrisch" => "T", "Koch" => "K", "Äqual" => "A", "Krusinsky" => "U", "Porphyrius" => "O", "Regiomontanus" => "R", "Campanus" => "C");
my (%elements, %quali);

foreach my $Feld (@Feldnamen) {
  $string=$cgi->param($Feld);
  chomp ($Feld);
  chomp ($string);
  if ($Feld eq "name") { $name = $string; }
  if ($Feld eq "datum") { $rx{"datum"} = date_format($string); }
  if ($Feld eq "uhrzeit") { $rx{"uhrzeit"} = $string; $rx{"uhrzeit"} =~ s/:/./g; }
  if ($Feld eq "long") { $rx{"long"} = $string; }
  if ($Feld eq "lat") { $rx{"lat"} = $string; }
  if ($Feld eq "dstr") { $ret_date = $string; }
  if ($Feld eq "dstr_tr") { $ret_date_tr = $string; }
  if ($Feld eq "offset") { $ret_offs = $string; }
  if ($Feld eq "multi") { $multi = $string; }
  if ($Feld eq "op") { $op = $string; }
  if ($Feld eq "filter") { $filter = $string; }
  if ($filter eq "Alle") { $filter = ""; }
  if ($Feld eq "hsys") { $hsys = $string; }
  if ($Feld eq "radix") { $radix = $string; }
  if ($Feld eq "transit") { $transit = $string; }
  if ($Feld eq "smart") { $smart = $string; }
  if ($Feld eq "ortsname") { $ort = $string; }
  if ($Feld eq "hlo") { $home_long = $string; $hlo_set = 1;}
  if ($Feld eq "hla") { $home_lat = $string; $hla_set = 1;}
  if ($Feld eq "hinweis") { hinweis ($string);}
}

#DEBUG:
#$smart = 1;
#$name = "Test";
#$rx{"datum"} = "26.03.2025";
#$rx{"uhrzeit"} = "1:28";
#$rx{"long"} = "11.08";
#$rx{"lat"} = "49.46";
#$rx{"hsys"} = "Placidus";
#$rx{"radix"} = "1";

#------------------------------------------------------------------------------
# Html 
#------------------------------------------------------------------------------
print "<!DOCTYPE html>\n";
print "<html>\n";
print "<head>\n<title>jaap ($version)</title>\n";
print "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\n";
print "<link rel=\"icon\" href=\"favicon.ico\" type=\"image/x-icon\">";
print "<link rel=\"stylesheet\" href=\"$css\" />\n";
print "</head>\n";
print "<body id=\"Seite\">\n";

if ($transit) { $radix = 0; }
if ($hlo_set && $hla_set) { print "<div id=\"homecgi\" style=\"display: none\">$home_long $home_lat</div>\n"; }
else { print "<div id=\"homecgi\" style=\"display: none\"></div>\n"; }


#---------- DEBUG --------
#$filter = "Mercury";
#-------------------------

if ($ret_date ne "") { %rx = spl_datestr($ret_date); }
if ($transit)  { %tr = spl_datestr($ret_date_tr); }

# Wenn ein Ort übergeben Wurde nur die Ortssuche durchführen
if ($ort ne "") { ortssuche($ort); }

# Der Status wird im Javascriptcode ausgelesen
my $status;
if ($radix == 1) { $status = "radix"; }
elsif ($transit == 1) { $status = "transit"; }
else { $status = "jaap $version"; }

# Standard System ist Placidus
#if ($hsys eq "") { $hsys = "Placidus"; }
if ($hsys ne "Keine") {
   push(@pl,"Ascendant");
   push(@pl,"MC");  
}

# ein offset wurde übergeben - wird draufgerechnet
if ($ret_date ne "" && $ret_offs ne "") { 
   if ($transit) { 
      ($tr{"datum"}, $tr{"uhrzeit"}) = calc_offset($ret_date_tr);
      $tr{"long"} = $home_long;
      $tr{"lat"} = $home_lat;
      chomp ($tr{"datum"}, $tr{"uhrzeit"}, $tr{"long"}, $tr{"lat"});
   }
   else {
      ($rx{"datum"}, $rx{"uhrzeit"}) = calc_offset($ret_date);
      $rx{"long"} = $home_long;
      $rx{"lat"} = $home_lat;
      chomp ($rx{"datum"}, $rx{"uhrzeit"}, $rx{"long"}, $rx{"lat"});
   }
}


# wenn kein Datum übergeben, aktuelles Datum und Uhrzeit verwenden
if (($transit && $tr{"datum"}  eq "") || (!$transit && $rx{"datum"} eq "")) {
   my $locstr = ZoneDetect($home_long, $home_lat);

   if ($transit) {
      $tr{"datum"} = `TZ="$locstr" date "+%d.%-m.%Y"`;
      $tr{"uhrzeit"} = `TZ="$locstr" date "+%-H.%M"`;
      $tr{"long"} = $home_long;
      $tr{"lat"} = "$home_lat";
      chomp ($tr{"datum"}, $tr{"uhrzeit"}, $tr{"long"}, $tr{"lat"});
   }
   else {
      $rx{"datum"} = `TZ="$locstr" date "+%d.%-m.%Y"`;
      $rx{"uhrzeit"} = `TZ="$locstr" date "+%-H.%M"`;
      $rx{"long"} = $home_long;
      $rx{"lat"} = "$home_lat";
      chomp ($rx{"datum"}, $rx{"uhrzeit"}, $rx{"long"}, $rx{"lat"});
   }

#   my ($usec,$umin,$uhour,$umday,$umon,$uyear,$uwday,$uyday,$uisdst) = localtime(time);
#   $umon +=1;
#   $uyear += 1900;
#   if(length($umin) < 2){ $umin="0".$umin; }
#
#   if ($transit) {
#      $tr{"datum"} = join('.', $umday, $umon, $uyear);
#      $tr{"uhrzeit"} = join('.', $uhour, $umin);
#      $tr{"long"} = $home_long;
#      $tr{"lat"} = "$home_lat";
#      chomp ($tr{"datum"}, $tr{"uhrzeit"}, $tr{"long"}, $tr{"lat"});
#   }
#   else {
#      $rx{"datum"} = join('.', $umday, $umon, $uyear);
#      $rx{"uhrzeit"} = join('.', $uhour, $umin);
#      $rx{"long"} = $home_long;
#      $rx{"lat"} = "$home_lat";
#      chomp ($rx{"datum"}, $rx{"uhrzeit"}, $rx{"long"}, $rx{"lat"});
#   }
}

# bc (vor Christus)
if ($rx{"uhrzeit"} =~ /bc/) {
   $rx{"uhrzeit"} =~ s/bc//g;
   $rx{"uhrzeit"} =~ s/^\s+|\s+$//g;
   @p = split(/\./, $rx{"datum"});
   $p[2] -= 1;
   $p[2] = sprintf("%04d", $p[2]);
   if ($p[2] != 0) { $p[2] = "-".$p[2]; }
   $rx{"datum"} = join(".",@p);
}

if ($rx{"uhrzeit"} eq "") {
   $rx{"uhrzeit"} = "12:00";
   $hsys = "Keine";
}

# default Häuser Placidus
if ($hflag{$hsys} eq "") { $hs = "P"; }
else { $hs = $hflag{$hsys}; }


#------------------------------------------------------------------------------
# Abfrage der swiss ephemeries
#------------------------------------------------------------------------------

# Zeit in UT umrechnen
my ($tz, @utc);
$tz = ZoneDetect($rx{"long"}, $rx{"lat"}, $rx{"datum"}, $rx{"uhrzeit"});
$rx{"utc"} = $tz;
$rx{"mode"} = "radix";
get_ephe(\%rx);

if ($transit) {
   $tz = ZoneDetect($tr{"long"}, $tr{"lat"}, $tr{"datum"}, $tr{"uhrzeit"});
   $tr{"utc"} = $tz;
   $tr{"mode"} = "transit";
   get_ephe(\%tr);
}


#------------------------------------------------------------------------------
# Menue und Statusanzeigen generieren
#------------------------------------------------------------------------------
if ($radix) { $style = "style=\"background-color: #FEFFF0;\""; }
elsif ($transit) { $style = "style=\"background-color: #FEFFF0;\""; }
else { $style = "style=\"background-color: #FEFFF0;\""; }
print "<table class=\"head\" $style>\n<tr>\n";
print "<td class=\"bsub\">\n<button id=\"sub\" class=\"submenue\" onmouseover=\"show_info('Menue')\" onclick=\"openmenue()\">☰</button></td>\n";
print "<td class=\"bnew\">\n<button id=\"new\" onmouseover=\"show_info('Neues Horoskop')\">N</button></td>\n";
print "<td class=\"bnow\">\n<button id=\"now\" onmouseover=\"show_info('Aktuelles Horoskop')\" onclick=\"reset()\">!</button></td>\n";
if ($radix) { print "<td class=\"btrans\">\n<button id=\"tra\" onmouseover=\"show_info('Transit Horoskop')\" onclick=\"set_transit()\">T</button></td>\n"; }
elsif ($transit) { print "<td class=\"btrans\">\n<button id=\"tra\" onmouseover=\"show_info('Radix Horoskop')\" onclick=\"restore_radix()\">R</button></td>\n"; }
else { print "<td class=\"btrans\"></td>"; }

# Die dynamische Zeitnavigation (wird im Radix Modus nicht eingeblendet)
if (!$radix) {
   if ($multi eq "") { $multi = 1; }
   print "<td class=\"bmult\">\n<input type=\"number\" id=\"mult\" min=\"1\" max=\"99\" value=\"$multi\" onmouseover=\"show_info('Multiplikator')\"></td>\n";
   #print "<td class=\"bmult\">\n<input type=\"text\" name=\"mul\" id=\"mult\" value=\"$multi\" onmouseover=\"show_info('Multiplikator')\">\n</td>\n";
   print "<td class=\"offstr\">\n<select id=\"offset\">\n";
   my @offsel = ("Minute", "Stunde", "Tag", "Woche", "Monat", "Jahr");
   foreach (@offsel) {
      chomp ($_);
      if ($_ eq "Stunde") {
         if ($ret_offs eq "" || $ret_offs eq "Stunde") { print "<option selected=\"selected\">Stunde</option>\n"; }
         else { print "<option>Stunde</option>\n"; }
      }
      else {
         if ($_ eq "$ret_offs") { print "<option selected=\"selected\">$_</option>\n"; }
         else { print "<option>$_</option>\n"; }
      }
   }
   print "</select>\n</td>\n";
   print "<td class=\"bpl\">\n<button id=\"plus\" onmouseover=\"print_offs(\'plus\')\" onclick=\"set_offs(\'plus\')\">+</button></td>\n";
   print "<td class=\"bmin\">\n<button id=\"minus\" onmouseover=\"print_offs(\'minus\')\" onclick=\"set_offs(\'minus\')\">-</button></td>\n";
}
else { print "<td class=\"radix\" id=\"rmode\">$name</td>\n"; }

# Auswahl Häusersystem
#print "<td class=\"hstr\">H:</td>\n";
print "<td class=\"hs\">\n<select id=\"hsys\" onmouseover=\"show_info('Häuser')\">\n<option>Keine</option>\n";
foreach (keys %hflag) {
   chomp ($_);
   if ($_ eq $hsys) { print "<option selected=\"selected\">$_</option>\n"; }
   else { print "<option>$_</option>\n"; }
}

# Auswahl Planetenfilter
print"</select></td>\n";
#print "<td class=\"hstr\">P:</td>\n";
print "<td class=\"pl\">\n<select id=\"planets\" onmouseover=\"show_info('Planet')\">\n";
if (!$filter) { print "<option selected=\"selected\">Alle</option>\n"; }
else { print "<option>Alle</option>\n"; }

foreach (@pl) {
   if ($filter && $filter eq $_) { print"<option selected=\"selected\">$_</option>\n"; }
   else { print"<option>$_</option>\n"; } 
   #print"<option>$_</option>\n";
}
print "</select>\n</td>\n";

# Datum Uhrzeit Long und Lat anzeigen
if ($transit) {
   @utc = split(/;/,$tr{"utc"});
   $tr{"uhrzeit"} =~ s/\./\:/g;
   print "<td class=\"datestr\">\n<a href=\"javascript:set_date()\" class=\"zinfo\" id=\"atza\" onmouseover=\"show_tz()\">\n";
   print "<div id=\"dst\">$tr{\"datum\"} $tr{\"uhrzeit\"} $utc[5] $tr{\"long\"} $tr{\"lat\"}</div></a></td>\n";
}
else {
   @utc = split(/;/,$rx{"utc"});
   $rx{"uhrzeit"} =~ s/\./\:/g;
   print "<td class=\"datestr\">\n<a href=\"javascript:set_date()\" class=\"zinfo\" id=\"atza\" onmouseover=\"show_tz()\">\n";
   print "<div id=\"dst\">$rx{\"datum\"} $rx{\"uhrzeit\"} $utc[5] $rx{\"long\"} $rx{\"lat\"}</div></a></td>\n";
}

# Infostring
print "<td class=\"infostr\">\n<div id=\"info\">$status</div></td>\n";
print "</tr>\n</table>\n";

# Sandwich Menue generieren
submenue();


#------------------------------------------------------------------------------
# Tabellen und Grafik nur zeichnen, wenn Häusersystem übergeben wurde
# Dies geschieht über einen XHR vom Javascript.
#------------------------------------------------------------------------------
if ($hsys ne "") {

   #------------------------------------------------------------------------------
   # Planeten und Häuser und Aspekt Tabelle
   #------------------------------------------------------------------------------

   #------------------------------------------------------------------------------
   # Planeten
   print "<div class=\"links\">\n";

   #DEBUG
   print "<div class=\"debug\" id=\"dbg\">$utc[4] $utc[0] $utc[1]</div>\n";
   print "<div class=\"debug\" id=\"tzi\">$utc[4] ($utc[2])</div>\n";

   print "<h4 class=\"tplanets\">Planeten</h4>\n<table id=\"tabplanets\">\n";
   foreach (@pl) {
      $hlpl = "";
      if ($filter eq $_) { $hlpl = " style=\"background-color:#00ff00;\""; }
      next if ($_ eq "Ascendant" or $_ eq "MC");
      # Hausposition des Planeten bestimmen
      if ($transit) { if ($hsys ne "Keine") { $pl_h{$_} = planet_house (get_ang($planets_tr{$_}), $_); }}
      else { if ($hsys ne "Keine") { $pl_h{$_} = planet_house (get_ang($planets{$_}), $_); }}
      if ($transit) { @reldeg = split(/\s+/, relative_deg($planets_tr{$_},"sym")); }
      else { @reldeg = split(/\s+/, relative_deg($planets{$_},"sym")); }   
      @p = split (/°/, $reldeg[0]);
      #$planets_rel{$reldeg[1]} .= $p[0].",".$psym{$_}.":";
      $planets_rel{$_} = $reldeg[0]." ".$reldeg[1];

      calc_elements($psym{$_}, $reldeg[1]);

      if (!$transit) {
         print "<tr$hlpl>\n<td class=\"diff1\">$psym{$_}</td>\n<td class=\"diff2\">$reldeg[0]</td>\n<td class=\"diff3\">$reldeg[1]</td>\n<td class=\"diff4\"><div class =\"grey\">$rueckl{$_}</div></td>\n</tr>\n"; }
      else {
         print "<tr$hlpl>\n<td class=\"diff1\">$psym{$_}</td>\n<td class=\"diff2\">$reldeg[0]</td>\n<td class=\"diff3\">$reldeg[1]</td>\n<td class=\"diff4\"><div class =\"grey\">$rueckl_tr{$_}</div></td>\n</tr>\n"; }


   }
   print "</table>\n";


   #------------------------------------------------------------------------------
   # Häuser
   my $fhouse;
   if ($hsys ne "Keine") {
      print "<h4>Häuser</h4>\n<table id=\"tabhouses\">\n";
      if ($hsys ne "Keine" && $rx{"uhrzeit"} ne "") {
         foreach (sort keys %houses) {
            $hnr = $_;
            $hnr =~ s/house //g;
            @reldeg = split(/\s+/, relative_deg($houses{$_}, "sym"));
            $hlh = "";
            $fhouse = $hnr;
            $fhouse =~ s/^\s+|\s+$//g;
            #if ($pl_h{$filter} eq $fhouse) { $hlh = " style=\"background-color:#ff9900;\"";}

            calc_elements($hnr, $reldeg[1]);

            print "<tr>\n<td class=\"diff1\">$hnr</td>\n<td class=\"diff2\">$reldeg[0]</td>\n<td class=\"diff3\">$reldeg[1]</td>\n<td class=\"diff4\"></td></tr>\n";
         }
      }
      else { print "<tr><td></td></tr>\n"; }
      print "</table>\n";
   }

   #------------------------------------------------------------------------------
   # Elemente und Qualitäten

   #print "<h4>Elemente</h4>\n";
   print "<table id=\"tabelement\">\n";
   print "<tr>\n<td><div class=\"eq\">E </div></td>\n"; 
   print "<td><div style=\"display: inline; color: red;\">F$elements{'F'}</div>\n"; 
   print "<div style=\"display: inline; color: green;\">E$elements{'E'}</div>\n"; 
   print "<div style=\"display: inline; color: #9c8800;\">L$elements{'L'}</div>\n"; 
   print "<div style=\"display: inline; color: blue;\">W$elements{'W'}</div></td>\n</tr>\n"; 
   
   print "<tr>\n<td><div class=\"eq\">Q </div></td>\n"; 
   print "<td><div style=\"display: inline;\">K$quali{'K'}</div>\n"; 
   print "<div style=\"display: inline;\">F$quali{'F'}</div>\n"; 
   print "<div style=\"display: inline;\">V$quali{'V'}</div>\n"; 
   print "</td>\n</tr>\n</table>\n"; 

   print "</div>\n";


   #------------------------------------------------------------------------------
   # Aspekte
   my $heading;
   if ($transit) { @aspects = calc_asp(\%planets, \%planets_tr); $heading = "Transite"}
   else  { @aspects = calc_asp(\%planets, \%planets); $heading = "Aspekte";}

   # Den Zodiak zeichnen
   if ($transit) { $template = "transit.svg"; } 
   draw_zodiac();

   my $aspstr;
   my %asp_l = ("☌" => "KON", "□" => "QUA", "△" => "TRI", "☍" => "OPP", "⚹" => "SEX");
   print "<div class=\"asp\">\n";
   if ($filter) { $transpl = translate($filter); print "<h4>$heading ($transpl)</h4>\n<table id=\"tabasp\">\n"; }
   else { print "<h4>$heading</h4>\n<table id=\"tabasp\">\n"; }
   foreach (@aspects) {
      @p = split (/;/, $_);
      $p[2] =~ s/[+-]//g;
      $aspstr = join(':', $p[0], $asp_l{$p[3]}, $p[1]); 
      print "<tr>\n<td nowrap><a href=\"javascript:show_tb('$aspstr')\" class=\"ainfo\">\n";
      print "<span class=\"as\">$psym{$p[0]}</span>\n";
      print "<span class=\"as\"> $p[3]</span>\n";
      print "<span class=\"as\">$psym{$p[1]}</span>\n</a></td>\n"; 
      print "<td><span class=\"as2\">($p[2]°)</span></td>\n</tr>";
      #print "<td><a href=\"javascript:show_tb()\" class=\"zinfo\">$p[3]</a></td>\n";
      #print "<td><a href=\"javascript:show_tb()\" class=\"zinfo\">$psym{$p[1]}</a></td>\n";
      #print "<td class=\"diff\"><a href=\"javascript:show_tb()\" class=\"zinfo\">$p[2]°</a></td>\n</tr>\n";

   }
   print "</table>\n</div>\n";

   if ($filter) {
      wuerden ($filter);
   }
}

#------------------------------------------------------------------------------
# smart controls
if ($smart) { draw_smart(); }

#------------------------------------------------------------------------------
# Modal Dialog Fenster
neu_dialog();
open_dialog();
open_about();
textbox();

# html generation abschliessen
print "<script src=\"$js\"></script>\n";
print "</body>\n</html>\n";

# --- ENDE ---



#------------------------------------------------------------------------------
# Funktionen
#------------------------------------------------------------------------------


#------------------------------------------------------------------------------
# Funktion spl_datestr
# Splittet den datestring und schreibt die parts in einen Hash
#------------------------------------------------------------------------------
sub spl_datestr {
   my @parts = split(/\s+/, $_[0]);
   my %dstr;

   $dstr{"datum"} = $parts[0];
   $dstr{"uhrzeit"} = $parts[1];
   $dstr{"long"} = $parts[3];
   $dstr{"lat"} = $parts[4];
   
   return (%dstr);
}


#------------------------------------------------------------------------------
# Funktion get_ephe
# Abfrage der swiss ephereries und einlesen der Daten
#------------------------------------------------------------------------------
sub get_ephe {

   my $dstr = shift;
   my @utc = split(/;/, $dstr->{"utc"}); 

   my $dbg = $dstr->{"mode"};
   #print "ephe: $dbg";

   # Daten an die swiss ephereries übergeben und output eingelesen
   my $cmd = `$swetest -edir$ephedir -pp -b$utc[0] -ut$utc[1] -house$dstr->{"long"},$dstr->{"lat"},$hs -g\";\"`;
   my @out = split(/\n/, $cmd);


   foreach (@out) {
      chomp ($_);
      if ($_ =~ /^Houses/) { $housesystem = $_; }
      if ($_ =~ /^date/) { 
         @p = split(/\s+/, $_);
         $datestr = $p[2]." ".$p[4]." ".$p[5];
      }
      @p = split (/;/, $_);
      $p[0] =~ s/^\s+|\s+$//g;
      $p[1] =~ s/^\s+|\s+$//g;
      if ($p[4] ne "") { $p[4] =~ s/^\s+|\s+$//g; }
      if ($dstr->{"mode"} ne "transit") {
         if ($p[0] =~ /^house /) { $houses{$p[0]} = $p[1]; }
      }
      foreach $pla (@pl) {
         if ($p[0] eq "$pla") {
            if ($dstr->{"mode"} eq "radix") {
               $planets{$p[0]} = $p[1];
               $speed{$p[0]} = $p[4];
               # Rückläufig
               if ($p[4] =~ /^-/) { $rueckl{$p[0]} = "R"; }
            }
            if ($dstr->{"mode"} eq "transit") {
               $planets_tr{$p[0]} = $p[1];
               $speed_tr{$p[0]} = $p[4];
               # Rückläufig
               if ($p[4] =~ /^-/) { $rueckl_tr{$p[0]} = "R"; }
            }
         }
      }
   }
}


#------------------------------------------------------------------------------
# Funktion Format
# Ändert die Formatierung des Datums
#------------------------------------------------------------------------------
sub date_format {
  if ($_[0] !~ /\-/) { return ($_[0]); }
  my @p = split(/-/,$_[0]);
  #foreach (@p) { $_ =~ s/^0//g; }
  $p[1] =~ s/^0//g; 
  $p[2] =~ s/^0//g; 
  return (join('.', $p[2], $p[1], $p[0]));
}


#------------------------------------------------------------------------------
# Funktion calc_offset
# rechnet einen Zeitoffset auf das Datum und die Uhrzeit
#------------------------------------------------------------------------------
sub calc_offset {

    my %secs = ("Minute" => 60, "Stunde" => 3600, "Tag" => 86400, "Woche" => 604800, "Monat" => 2592000, "Jahr" => 31536000);
    my @p1 = split (/\s+/, $_[0]);
    my @dstr = split (/\./, $p1[0]);
    my @tstr = split (/:/, $p1[1]);
    my $unixtime = timelocal(0,$tstr[1],$tstr[0],$dstr[0],$dstr[1]-1,$dstr[2]);

    if ($op eq "plus") { $unixtime += ($secs{$ret_offs} * $multi); }
    if ($op eq "minus") { $unixtime -= ($secs{$ret_offs} * $multi); }


    my ($sec, $min, $hour, $mday, $mon, $year, $wday, $yday, $isdst) = localtime($unixtime);
    $mon += 1;
    if ($min < 10) {$min = "0".$min; }
    $year += 1900;

    my $datestr = join('.', $mday, $mon, $year);
    my $timestr = join('.', $hour, $min);
   
    return ($datestr, $timestr);
}

#------------------------------------------------------------------------------
# Funktion draw_zodiac
# Fügt die Daten in den Zodiac ein
#------------------------------------------------------------------------------
sub draw_zodiac {
   my (@line);
   my $count = 0;
   my (%xy, %xy2);
   my ($l, $h, $p, $x, $as);
   my $hnr = 1;
   my $match = 0;
   my ($hname, $stroke, $strwidth, $fontsize, $fontweight, $color, $chx, $chy, $switch, @hnpos, $hnr_opp, @parts);
   my (%fs, %pos);
   my $run = $_[0];


   if ($transit) { $pos{"hline"} = 225; }
   else { $pos{"hline"} = 270; }

   # rotation zum AC
   my $ang = get_ang($houses{"house  1"});
   my $rot;
   #if ($rx{"uhrzeit"} ne "" && $hsys ne "Keine") {
   if ($rx{"uhrzeit"} ne "") {
      $rot ="     transform=\"rotate($ang, 350, 350)\">";
   }
   else { $rot = ">"; }

   open (SVG, "$template") or die ($!);
   while (<SVG>) { $line[$count++] = $_; }
   close (SVG);

   print "\n\n<div class=\"links\">\n";
   foreach $l (@line) {
     next if ($l =~ /\?xml/);
     if ($l =~ /rotate\(/) { print $rot; }
     elsif ($l =~ /--houses--/) {
        print "$l\n";
        if ($hsys ne "Keine" && $rx{"uhrzeit"} ne "") {
           foreach $h (sort keys %houses) {
              $hname = "house  $hnr";
              if ($hnr == 1 || $hnr == 4) { $stroke = "#999999"; $strwidth = "3px"; }
              else { $stroke = "#cccccc"; $strwidth = "1px"; }
              %xy = get_xy($houses{$hname},$pos{"hline"});
              print "  <path\n";
              print "  id=\"ac\"\n";
              print "  d=\"M ".$xy{"xstart"}." ".$xy{"ystart"}." L ". $xy{"xziel"}." ".$xy{"yziel"}." \"\n";
              print "  style=\"fill:none;fill-rule:evenodd;stroke:$stroke;stroke-width:$strwidth;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1\" />\n\n";
              last if ($hnr++ == 6);
           }
        }
     }
     elsif ($l =~ /--planets--/) {
         print "$l\n";
         draw_planets(1, \%planets);
         if ($transit) { draw_planets(2, \%planets_tr); }
     }

     #elsif ($l =~ /--hnr--/) {
     #     print SVG "$l\n";
     #     @hnpos = get_hnr_deg();
     #     $hnr = 1;
     #     foreach $x (@hnpos) {
     #        next if ($x eq "");
     #        %xy = get_xy(offset($x),155);
     #
     #        $chx = $xy{"xstart"} - 10;
     #        $chy = $xy{"ystart"} + 10;               
     #
     #         $hnr_opp = $hnr + 6;
     #         print SVG "<text x=\"".$chx."\" y=\"".$chy."\" style=\"font-size:20px; fill:#999999\">".$hnr."</text>\n"; 
     #         print SVG "<text x=\"".$xy{"xziel"}."\" y=\"".$xy{"yziel"}."\" style=\"font-size:20px; fill:#999999\">".$hnr_opp."</text>\n";
     #         $hnr++;
     #    }
     #}

     elsif ($l =~ /--marker--/) {
        print "$l\n";
        draw_marker(1, \%planets);
        if ($transit) { draw_marker(2, \%planets_tr); }
     }

     elsif ($l =~ /--aspectlines--/) {
        foreach $as (@aspects) {
           @parts = split (/;/, $as);

           if ($parts[3] eq "□" || $parts[3] eq "☍") { $color = "#ff0000"; }
           if ($parts[3] eq "△" ) { $color = "#0000ff"; }
           if ($parts[3] eq "⚹" ) { $color = "#0000ff"; }
           $parts[2] =~ s/\+//;
           $parts[2] =~ s/\-//;
           if ($parts[2] >= 0) { $stroke = 3; }
           if ($parts[2] > 2) { $stroke = 2; }
           if ($parts[2] > 3) { $stroke = 1; }

           #%xy = get_xy($planets{"$parts[0]"}, 150);
           #%xy2 = get_xy($planets{"$parts[1]"}, 150);

           if ($transit) {
           %xy = get_xy($planets_tr{"$parts[0]"}, 150);
           %xy2 = get_xy($planets{"$parts[1]"}, 150);
           }
           else {
           %xy = get_xy($planets{"$parts[0]"}, 150);
           %xy2 = get_xy($planets{"$parts[1]"}, 150);
           }

           print "  <path\n";
           print "  d=\"M ".$xy{"xstart"}." ".$xy{"ystart"}." L ".$xy2{"xstart"}." ".$xy2{"ystart"}." \"\n";
           print "  style=\"fill:none;fill-rule:evenodd;stroke:$color;stroke-width:$stroke;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1\" />\n\n";
        }
     }


     else { print $l; }
   }
   print "</div>\n\n";
   #close (SVG);
}


#------------------------------------------------------------------------------
# Funktion calc_elements
# Berechnet die Verteilung der Planeten und Achsen auf die Elemente
#------------------------------------------------------------------------------
sub calc_elements {
   #print "DEBUG: $_[0] $_[1]\n";
   my ($el, $qt);
   my $factor;

   # Element bestimmen
   if ( $_[1] eq "♈︎" || $_[1] eq "♌︎" || $_[1] eq "♐︎") { $el = "F"; }
   elsif ( $_[1] eq "♉︎" || $_[1] eq "♍︎" || $_[1] eq "♑︎") { $el = "E"; }
   elsif ( $_[1] eq "♊︎" || $_[1] eq "♎︎" || $_[1] eq "♒︎") { $el = "L"; }
   elsif ( $_[1] eq "♋︎" || $_[1] eq "♏︎" || $_[1] eq "♓︎") { $el = "W"; }
   else { $el = "X"; }

   # Qualität bestimmen
   if ( $_[1] eq "♈︎" || $_[1] eq "♋︎" || $_[1] eq "♎︎" || $_[1] eq "♑︎") { $qt = "K"; }
   elsif ( $_[1] eq "♉︎" || $_[1] eq "♌︎" || $_[1] eq "♏︎" || $_[1] eq "♒︎") { $qt = "F"; }
   elsif ( $_[1] eq "♊︎" || $_[1] eq "♍︎" || $_[1] eq "♐︎" || $_[1] eq "♓︎") { $qt = "V"; }
   else { $qt = "X"; }

   # zusammen zählen
   if ($_[0] eq "☉" || $_[0] eq "☽" || $_[0] == 1 || $_[0] == 10) { $factor = 3; }
   elsif ($_[0] eq "☿" || $_[0] eq "♀" || $_[0] eq "♂") { $factor = 2; }
   elsif ($_[0] eq "♃" || $_[0] eq "♄" || $_[0] eq "⛢" || $_[0] eq "♆" || $_[0] eq "♇" || $_[0] eq "☊" || $_[0] eq "⚷") { $factor = 1; }
   else { $factor = 0; }

   $elements{$el} += $factor;
   $quali{$qt} += $factor;

}


#------------------------------------------------------------------------------
# Funktion draw_planets
#------------------------------------------------------------------------------
sub draw_planets {
   my ($run, $pref) = @_;
   my($p, $match, $fontsize, $color, $fontweight, %fs, %pos, %xy, $switch, $chx, $chy);

   if ($transit && $run == 1) {
      $fs{"Sun"} = "32px"; $fs{"Moon"} = "32px"; $fs{"Venus"} = "28px"; $fs{"Mercury"} = "28px"; $fs{"Mars"} = "28px";
      $fs{"Uranus"} = "28px"; $fs{"Jupiter"} = "28px"; $fs{"Chiron"} = "28px"; $fs{"mean Apogee"} = "28px"; $fs{"default"} = "28px";
      $pos{"pl_a"} = 210;
      $pos{"pl_m"} = 188;
      $pos{"pl_i"} = 170;
      $pos{"chx"} = 14;
      $pos{"chy"} = 10;
   }
   elsif ($transit && $run == 2) {
      $fs{"Sun"} = "32px"; $fs{"Moon"} = "32px"; $fs{"Venus"} = "28px"; $fs{"Mercury"} = "28px"; $fs{"Mars"} = "28px";
      $fs{"Uranus"} = "28px"; $fs{"Jupiter"} = "28px"; $fs{"Chiron"} = "28px"; $fs{"mean Apogee"} = "28px"; $fs{"default"} = "28px";
      $pos{"pl_a"} = 285;
      $pos{"pl_m"} = 305;
      $pos{"pl_i"} = 325;
      $pos{"chx"} = 14;
      $pos{"chy"} = 10;
   }

   else {
      $fs{"Sun"} = "46px"; $fs{"Moon"} = "46px"; $fs{"Venus"} = "40px"; $fs{"Mercury"} = "40px"; $fs{"Mars"} = "40px";
      $fs{"Uranus"} = "40px"; $fs{"Jupiter"} = "40px"; $fs{"Chiron"} = "40px"; $fs{"mean Apogee"} = "40px"; $fs{"default"} = "40px";
      $pos{"pl_a"} = 242;
      $pos{"pl_m"} = 210;
      $pos{"pl_i"} = 178;
      $pos{"chx"} = 17;
      $pos{"chy"} = 12;
   }

   my %inner = layout_planets($pref);
   foreach $p (sort keys %$pref) {
      $match = 0;
       next if ($p eq "Ascendant" or $p eq "MC");
       if ($p eq "Sun") { $fontsize = $fs{"Sun"}; $color = "#ffc300"; $fontweight = "bold";} #50px
       elsif ($p eq "Moon") { $fontsize = $fs{"Moon"}; $color = "#0000ff"; $fontweight = "bold"; } #50px
       elsif ($p eq "Venus") { $fontsize = $fs{"Venus"}; $color = "#00ff00"; $fontweight = "normal"; }
       elsif ($p eq "Mercury") { $fontsize = $fs{"Mercury"}; $color = "#d7bb00"; $fontweight = "normal"; }
       elsif ($p eq "Mars") { $fontsize = $fs{"Mars"}; $color = "#ff0000"; $fontweight = "normal"; }
       elsif ($p eq "Uranus") { $fontsize = $fs{"Uranus"}; $color = "#00ffff"; $fontweight = "normal"; }
       elsif ($p eq "Jupiter") { $fontsize = $fs{"Jupiter"}; $color = "#ff00ff"; $fontweight = "normal"; }
       elsif ($p eq "Chiron") { $fontsize = $fs{"Chiron"}; $color = "#999999"; $fontweight = "normal"; }
       elsif ($p eq "mean Apogee") { $fontsize = $fs{"mean Apogee"}; $color = "#999999"; $fontweight = "normal"; }
       else { $fontsize = $fs{"default"}; $color = "#000000"; $fontweight = "normal";}
       #%xy = get_xy(offset($pref->{$p}), 270);
       #print "<text x=\"".$xy{"xstart"}."\" y=\"".$xy{"ystart"}."\" style=\"font-size:12px; fill:$color \">|</text>\n";

       #print "DEBUG:\n";
       $match = 0;
       foreach $switch (keys %inner) {
          if ($p eq $switch) {
             $match = 1;
             #print "treffer: $switch: $inner{$switch}\n";
             if ($inner{$switch} eq "I") { %xy = get_xy(offset($pref->{$p}), $pos{"pl_i"}, $force{$p}); }
             if ($inner{$switch} eq "M") { %xy = get_xy(offset($pref->{$p}), $pos{"pl_m"}, $force{$p}); }
          }
       }
       if ($match == 0) {
          %xy = get_xy(offset($pref->{$p}), $pos{"pl_a"}, $force{$p});
       }


       $chx = $xy{"xstart"} - $pos{"chx"}; #-20
       $chy = $xy{"ystart"} + $pos{"chy"}; #+15

       #print SVG "<text x=\"".$chx."\" y=\"".$chy."\" style=\"font-size:$fontsize; font-weight: $fontweight; fill:$color\">".$psym{$p}."</text>\n";
       $transpl = translate($p);
       if ($transit && $run == 1)  { print "<text x=\"".$chx."\" y=\"".$chy."\" style=\"font-size:$fontsize; font-weight: $fontweight; font-style: normal; fill:$color\">".$psym{$p}."</text>\n"; }
       else {  print "<text x=\"".$chx."\" y=\"".$chy."\" onmouseover=\"show_info('$transpl [$pl_h{$p}]')\" onclick=\"set('$p')\" style=\"font-size:$fontsize; cursor:pointer; font-weight: $fontweight; font-style: normal; fill:$color\">".$psym{$p}."</text>\n"; }
   }
}

#------------------------------------------------------------------------------
# Funktion draw_marker
#------------------------------------------------------------------------------
sub draw_marker {

   my ($run, $pref) = @_;
   my ($p, $color, %xy, %pos);

   
   if ($transit) { $pos{"marker"} = 232; }
   else { $pos{"marker"} = 277; }


   foreach $p (sort keys %$pref) {
      next if ($p eq "Ascendant" or $p eq "MC");
      if ($p eq "Sun") { $color = "#ffc300";}
      elsif ($p eq "Moon") { $color = "#0000ff"; }
      elsif ($p eq "Venus") { $color = "#00ff00"; }
      elsif ($p eq "Mercury") { $color = "#d7bb00"; }
      elsif ($p eq "Mars") { $color = "#ff0000"; }
      elsif ($p eq "Uranus") { $color = "#00ffff"; }
      elsif ($p eq "Jupiter") { $color = "#ff00ff"; }
      elsif ($p eq "Chiron") { $color = "#999999"; }
      elsif ($p eq "mean Apogee") { $color = "#999999"; }
      else { $color = "#000000"; }
      %xy = get_xy($pref->{$p}, $pos{"marker"});
      #print SVG "<text x=\"".$xy{"xstart"}."\" y=\"".$xy{"ystart"}."\" style=\"font-size:12px; fill:$color \">+</text>\n";
      print "  <path\n";
      print "  d=\"M ".$xy{"xstart"}." ".$xy{"ystart"}." L 350 350 \"\n";
      print "  style=\"fill:none;fill-rule:evenodd;stroke:$color;stroke-width:3;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1\" />\n\n";
   }
}


#------------------------------------------------------------------------------
# Funktion get_xy
# Berechnet die x und y koortinate aus dem Winkel
#------------------------------------------------------------------------------
sub get_xy {
   my $ang = get_ang($_[0]);
   my $radius = $_[1];
   my $fflag = $_[2];
   my %result;

   # zwei Planeten auf der gleichen bahn -> offset plus oder minus
   if ($fflag eq "xm") {
      $ang -= 3;
   }
   if ($fflag eq "xp") {
      $ang += 3;
   }

   # winkel umrechnen
   my $deg_start;
   my $deg_ziel = 360 - $ang;
   if ($deg_ziel <= 180) { $deg_start = $deg_ziel + 180; }
   else { $deg_start = $deg_ziel - 180; }

   # umrechnen in Bogenmass (rad)
   my $rad_start = $deg_start / 180 * 3.141592;
   my $rad_ziel = $deg_ziel / 180 * 3.141592;

   # koortinaten berechnen
   my $xs = 350 + (cos($rad_start)*$radius);
   my $ys = 350 + (sin($rad_start)*$radius);
   my $xz = 350 + (cos($rad_ziel)*$radius);
   my $yz = 350 + (sin($rad_ziel)*$radius);


   $result{"xstart"} = int(100 * $xs + 0.5) / 100;
   $result{"ystart"} = int(100 * $ys + 0.5) / 100;
   $result{"xziel"} = int(100 * $xz + 0.5) / 100;
   $result{"yziel"} = int(100 * $yz + 0.5) / 100;

   return (%result);
}

#------------------------------------------------------------------------------
# Funktion get_ang
# Berechnet den dezimalwert des Winkels
#------------------------------------------------------------------------------
sub get_ang {

  if ($_[0] !~ /°/) { return ($_[0]); }
  my @p = split (/°/,$_[0]);
  my $grad = $p[0];
  my @p2 = split (/'/, $p[1]);
  my $min = $p2[0];
  my $sek = $p2[1];
 
  my $dec = ((($sek/60)+$min)/60)+$grad;
  my $roundet = int(100 * $dec + 0.5) / 100;

  return ($roundet);
}

#------------------------------------------------------------------------------
# Funktion set_ang
# Berechnet den winkel aus dem Dezimalwert
#------------------------------------------------------------------------------
sub set_ang {
   my @p1 = split (/\./, $_[0]);
   my $deg = $p1[0];
   my $nk = "0"."\.".$p1[1];
   my $min = $nk * 60;

   my @p2 = split (/\./, $min);

   $nk = "0"."\.".$p2[1]; 
   my $sek = $nk * 60;
   my $ret = $deg."°".$p2[0]."\'".$sek."\"";
   return ($ret);
}


#------------------------------------------------------------------------------
# Funktion offset
# fügt einen offset der Rotation hinzu
#------------------------------------------------------------------------------
sub offset {
   my $off = get_ang($houses{"house  1"});
   #if ($rx{"uhrzeit"} eq "" || $hsys eq "Keine") { $off = 0; }
   if ($rx{"uhrzeit"} eq "") { $off = 0; }
   my $ang = get_ang($_[0]);
   my $ret;
 
   $ret = $ang - $off;
   if ($ret < 0) { $ret += 360; }
 
   return ($ret);
}

#------------------------------------------------------------------------------
# Funktion get_hnr_deg
# berechnet die Winkel der Häuserbeschriftung
#------------------------------------------------------------------------------
sub get_hnr_deg {
   my (@housepos, $save);
   my $count = 0;
   foreach (sort keys %houses) {
      if ($count > 0) { $housepos[$count] = (get_ang($houses{$_}) + get_ang($save)) / 2; }
      $save = $houses{$_};
      $count ++;
      last if ($count == 7);
   }
   return (@housepos);
}

#------------------------------------------------------------------------------
# Funktion calc_asp
# Berechnet die Aspekte zwischen den Planeten
#------------------------------------------------------------------------------
sub calc_asp {
   my ($refpl2, $refpl1) = @_;
   my ($first, $second, $deg, $offset, $a, $from, $to, $fromrev, $torev, $diff, @skip, $sk, $test, $found);   
   my $count = 0;
   my $match = 0;
   my $acount = 0;
   my %orbis;
   if (!$transit) {
      %orbis = ("Sun" => 8, "Moon" => 8, "Mercury" => 6, "Venus" => 6, "Mars" => 6, "Jupiter" => 4,
                "Saturn" => 4, "Chiron" => 4, "Uranus" => 3, "Neptune" => 3, "Pluto" => 3);
   }
   else { %orbis = ("Sun" => 3, "Moon" => 3, "Mercury" => 3, "Venus" => 3, "Mars" => 3, "Jupiter" => 3,
                    "Saturn" => 3, "Chiron" => 3, "Uranus" => 3, "Neptune" => 3, "Pluto" => 3);
   }

   my %asp = ("☌" => 0, "⚹" => 60, "□" => 90, "△" => 120, "☍" => 180);

   foreach $first (@pl) {
      foreach $second (@pl) {
         if ($first eq "Neptune" && $second eq "Pluto") {
            print "";
         }
         next if (!$transit && $first eq $second);
         $deg = get_ang($refpl1->{$first}) - get_ang($refpl2->{$second});
         $deg =~ s/-//g;
         if ($orbis{$first} > $orbis{$second}) { $offset = $orbis{$first}; }
         else { $offset = $orbis{$second}; }
         foreach $a (keys %asp) {
            $from = $asp{$a} - $offset;
            $to = $asp{$a} + $offset;            
            $fromrev = 360 - $asp{$a} - $offset;
            $torev = 360 - $asp{$a} + $offset;

            if ($deg >= $from && $deg <= $to) { $match = 1; }
            if ($deg >= $fromrev && $deg <= $torev) {$match = 2; }
            if ($match > 0) {
               if ($match  == 1) { $diff = sprintf("%2.1f", ($deg - $asp{$a})); }
               if ($match  == 2) { 
                  $diff = sprintf("%2.1f", ($deg - (360 - $asp{$a})));
                  #if ($diff > 0) { $diff = "-".$diff; }
               }
               if ($diff >= 0) { $diff = "+".$diff; }
               # doppelte eliminieren
               #if ($first ne $second) {
               if (!$transit) {
                  $skip[$count++] = $second."_".$first;
                  $test = $first."_".$second;
                  $found = 0;
                  foreach $sk (@skip) {
                     if ($sk eq $test) { $found = 1; }
                  }
               }
               if (!$found) {
                  #print "<tr>\n<td>$psym{$first}</td><td>$a</td><td>$psym{$second}</td><td class=\"diff\">$diff°</td>\n</tr>\n";
                  if ($filter eq "") { $aspects[$acount++] = join(';', $first, $second, $diff, $a); } 
                  if ($transit) {
                     if (($filter ne "") && ($filter eq $first)) {
                        $aspects[$acount++] = join(';', $first, $second, $diff, $a);
                     }
                  }
                  else {
                     if (($filter ne "") && ($filter eq $first || $filter eq $second)) {
                        $aspects[$acount++] = join(';', $first, $second, $diff, $a);
                     }
                  }
               }
              $match = 0;
            }
         } 
      }      
   }
   return (@aspects);
}

#------------------------------------------------------------------------------
# Funktion relative_deg
# Berechnet aus dem Absoluten Winkel von 0° Widder 
# den relativen Winkel im Tierkreiszeichen
#------------------------------------------------------------------------------
sub relative_deg {
   my ($max, $relw);
   my %rel_deg;

   if ($_[1] eq "sym") {  
      %rel_deg = (0 => "♈︎", 30 => "♉︎", 60 => "♊︎", 90 => "♋︎", 120 => "♌︎", 150 => "♍︎", 180 => "♎︎",
                  210 => "♏︎", 240 => "♐︎", 270 => "♑︎", 300 => "♒︎", 330 => "♓︎");
   }
   else {
      %rel_deg = (0 => "wid", 30 => "sti", 60 => "zwi", 90 => "kre", 120 => "loe", 150 => "jfr", 180 => "wag",
                  210 => "sko", 240 => "sch", 270 => "stb", 300 => "wma", 330 => "fis");
   }
   
   my @p1 = split(/°/, $_[0]);
   my $deg = $p1[0];
   $deg =~ s/^\s+|\s+$//g;
   my @p2 = split (/\'/, $p1[1]);
   my $min = $p2[0];
   $min =~ s/^\s+|\s+$//g;
   #my $sek = int($p2[1]);
   my $sek = sprintf("%2.0f", $p2[1]);
   $sek =~ s/^\s+|\s+$//g;


   foreach (keys %rel_deg) {
      $max = $_ + 29;
      if ($deg >= $_ && $deg <= $max) {
         $relw = $deg - $_;
         if ($relw < 10) { $relw = "0".$relw; }
         if ($min < 10) { $min = "0".$min; }
         if ($sek < 10) { $sek = "0".$sek; }
         return ($relw."°".$min."\'".$sek."\""." ".$rel_deg{$_});
      }
   }
}

#------------------------------------------------------------------------------
# Funktion planet_house
# Ermittelt in welchem Haus sich ein Planet befindet
#------------------------------------------------------------------------------
sub planet_house {
    my $pl_deg = $_[0];
    my @ph;
    my $x = 0;
    my @p;
    my ($sav, $house);

    foreach (keys %houses) {
       $ph[$x++] = get_ang($houses{$_})."_".$_;
    }

    $x = 0;
    foreach (sort {$a <=> $b} @ph) {
      @p = split(/_/, $_);
      if ($x > 0 && $pl_deg >= $sav && $pl_deg < $p[0]) {
         return ($house);
      }
      $sav = $p[0]; 
      $house = $p[1];
      $house =~ s/house//g;
      $house =~ s/\s+//g;
      $x++;
   }    
   return ($house);
}

#------------------------------------------------------------------------------
# Funktion layout_planets
# Verbessert die Darstellung der Planeten an einer Konjunktion
#------------------------------------------------------------------------------
sub layout_planets {
   my ($pref) = @_;
   my (%test, @p, @part, $x, $save, $test, $fastest, $savepl, @matches, $diff, %four, %change, $match_all, @uniq, $ma, $gr,$pa, $ca, $as, $do, $ord, $konst);
   my @order = ("Moon", "Mercury", "Venus", "Sun", "Mars", "mean Apogee", "Jupiter", "Saturn", "Chiron", "Uranus", "Neptune", "Pluto", "true Node");
   my $count = 0;
   my $matchcount = 0;
   my $anz = 0;
   my $found = 0;
   my $iset = 0;
   my @lock;
   my $lc = 0;
   my $plaa = 0;
   my $aec = 0;
   my $aef = 0;
   my (@aep, %aeg, $aes, @x);

   # Planeten ihrem Dezimalwinkel zuordnen
   foreach (@pl) {
      next if ($_ eq "Ascendant" or $_ eq "MC");
      #$x = get_ang ($planets{$_});
      $x = get_ang ($pref->{$_});
      $test {$_} = $x;
   }

   # Zusammenhängende Planeten in Gruppen aufteilen


   foreach  (sort { $test{$a} <=> $test{$b} } keys %test) {
      if ($count > 0) {
         $diff = $test{$_} - $save;
         $diff = sprintf("%.1f", $diff);
         if ($diff <= 8) {
            $found = 1;
            $match_all .= join(',', $savepl, $_).",";
         }
         else {
            if ($found) { 
               $match_all =~ s/,$//g;
               $matches[$matchcount] = uniq($match_all);
               $match_all = "";
               $matchcount++;
            }
            $found = 0;
         }
      }
      $save = $test{$_};
      $savepl = $_;
      # Planet(en) an der Anfangsgrenze (Widder)?
      if ($save <= 5) {
         $plaa = 1;
	      $aep[$aec++] = $savepl;
      }
      # Planet(en) an der Endgrenze (Fische)?
      if ($save >= 355 && $plaa == 1) {
	      $aef = 1;
	      $aep[$aec++] = $savepl;
      }
      $count++;
   }
   if ($found) { 
      $match_all =~ s/,$//g;
      $matches[$matchcount] = uniq($match_all);
   }

   # Grenzplaneten auswerten
   if ($aef) {
      $aec = 0;
      foreach $gr (@aep) {
         $aec = 0;
         foreach $ma (@matches) {
            if ($ma =~ /$gr/) {
               $aeg{$aec} .= $gr.",";               
            }
            $aec++;
         }
      }
      $aec = keys %aeg;
      foreach $gr (@aep){
         $aes .= $gr.",";
      }
      # Keiner ist in einer Gruppe
      if ($aec == 0) {
         chop ($aes);
         push @matches, $aes;
      }
      # einer ist in einer Gruppe
      elsif ($aec == 1) {
         @x = keys %aeg;
         foreach $gr (@aep) {
            if ($matches[$x[0]] !~ $gr) {
               $matches[$x[0]] .= ",".$gr;
            }
         }
      }
      # beide sind in einer Gruppe 
      elsif ($aec == 2) {
         @x = keys %aeg;
         $matches[$x[0]] .= ",".$matches[$x[1]];
         splice @matches, $x[1], 1;
      }
   }

   $count = 0;
   

   # Planeten Ebene bestimmen
   foreach $ma (@matches) {
      @p = split (/,/, $ma);
      $anz = $#p;

      # 2er Gruppe
      if ($anz == 1) {
         foreach $ord (@order) {
            if ($p[0] eq $ord) { $change{$ord} = "M"; last; }
            if ($p[1] eq $ord) { $change{$ord} = "M"; last; }
         }
      }

      # 3er Gruppe
      if ($anz == 2) {
         $iset = 0;
         $found = 0;
         foreach $ord (@order) { 
            last if ($found);
            foreach $ca (@p) {
               if ($iset && $ca eq $ord) { $change{$ord} = "M"; $iset = 0; $found = 1; last; }
               if (!$iset && $ca eq $ord) { $change{$ord} = "I"; $iset = 1; }
            }
         }
      }

      # 4er Gruppe und mehr
      if ($anz > 2) {
         $found = 0;
         # Der schnellste Planet kommt alleine auf die innerste Ebene
         # Ab einer Gruppe von 6 und mehr die beiden schnellsten auf die innere Ebene
         foreach $ord (@order) {
            last if ($found == 1 && $anz < 5);
            last if ($found == 2 && $anz >= 5);
            foreach $ca (@p) {
               if ($ca eq $ord) {
                  # gefunden
                  $change{$ord} = "I";
                  $fastest .= $ord."_";
                  $found ++;
               }   
            }
         }
         chop($fastest);
         @part = split(/_/,advanced_set($pref, $fastest, @p));
         if ($part[0] ne "") { $change{$part[0]} = "M"; }
         if ($part[1] ne "") { $change{$part[1]} = "M"; }

      }
   }
   return (%change);
}

#------------------------------------------------------------------------------
# Funktion uniq
# Enfernt doppelte Einträge aus einer Liste
#------------------------------------------------------------------------------
sub uniq {
    my @list = split (/,/,$_[0]);
    my %all;
    my $rest;
    grep {$all{$_}=0} @list;
    foreach (keys %all) { $rest .= $_.","; }  
    $rest =~ s/,$//g;
    return ($rest);
} 

#------------------------------------------------------------------------------
# Funktion advanced_set
# Versucht eine Gruppe von mehr als 4 Planeten möglichst gut zu Plazieren
#------------------------------------------------------------------------------
sub advanced_set {

   my ($pref, $fplstr, @list) = @_;
   my ($first, $second, $fastest, $deg, %ang, @skip, @fpl, $test, $found, $sk, $xi, @lock, @part, $xf, $xs);
   my $count = 0;
   my $anz = $#list;

   @fpl = split(/_/, $fplstr);
   my $anz_fpl = $#fpl;
   if ($anz_fpl == 0) { $fastest = $fpl[0]; }     
   if ($anz_fpl == 1) { set_force(@fpl); }     

   foreach $first (@list) {
      foreach $second (@list) {
         next if ($first eq $second);
         next if ($anz_fpl == 0 && ($first eq $fastest || $second eq $fastest));
         next if ($anz_fpl == 1 && ($first eq $fpl[0] || $second eq $fpl[0] || $first eq $fpl[1] || $second eq $fpl[1]));

         $xf = get_ang($pref->{$first});
         $xs = get_ang($pref->{$second});

         if ($xf <= 10 && $xs >= 350) {
            $deg = $xf + (360 - $xs);
         }
         elsif ($xf >= 350 && $xs <= 10) {
            $deg = (360 - $xf) + $xs;
         }
         else { 
            $deg = $xf - $xs;
         }
         $deg =~ s/-//g;
      
         # doppelte eliminieren
         $skip[$count++] = $second."_".$first;
         $test = $first."_".$second;
         $found = 0;
         foreach $sk (@skip) {
            if ($sk eq $test) { $found = 1; }
         }
         if (!$found) {
            $ang{join('_',$first, $second)} = $deg;
         }
      }
   }
   $count = 0;


   foreach (sort { $ang{$b} <=> $ang{$a} } keys %ang) {  
      if ($count == 0 && $anz < 4) {
         @lock = split(/_/, $_);
         set_force(@lock);
      }
      if ($count == 1) {
         if ($anz >= 4) { @lock = split(/_/, $_); }
         if ($anz < 4) {
            @part = split (/_/, $_);
            if ($part[0] ne $lock[0] && $part[0] ne $lock[1]) { return $part[0]; }
            if ($part[1] ne $lock[0] && $part[1] ne $lock[1]) { return $part[1]; }
         }
      }
      if ($count == 2) {
         @part = split (/_/, $_);
         if ($anz >= 4) {
            next if ($part[0] eq $lock[0] || $part[0] eq $lock[1] || $part[1] eq $lock[0] || $part[1] eq $lock[1]); 
            set_force(@part);
            return(join('_', $part[0], $part[1]));
         } 
      }
      $count++;
   }
}


#------------------------------------------------------------------------------
# Funktion set_force
# Wenn bei einer Planetenanhäufung zwei Planeten auf die selbe Bahn gezwungen
# sind, werden diese "auseinandergezogen" in dem der eine einen plus offset
# und der andere einen minus offset bekommt
#------------------------------------------------------------------------------
sub set_force {
   my @fplanets = @_;
   my (%compare, $x, $first, $last);
   my $count = 0;
   my $afl = 0;
   my $efl = 0;
   my $deg1 = 0;
   my $deg2 = 0;

   foreach (@fplanets) {
      $x = %planets{$_};
      $compare{$_} = get_ang($x);
   }

   foreach  (sort { $compare{$a} <=> $compare{$b} } keys %compare) {
      if ($count == 0) {
         $deg1 = $compare{$_};
         if ($compare{$_} <= 5) { $afl = 1; }
         $first = $_;
      }
      if ($count == 1) {
         $deg2 = $compare{$_};
         if ($compare{$_} >= 355) { $efl = 1; }
         $last = $_;
      }
      $count++;
   }
   if ($afl == 1 && $efl == 1) {
      $force{$first} = "xp"; $force{$last} = "xm";
   }
   else {
      if ($deg2 - $deg1 < 8) {
         $force{$first} = "xm"; $force{$last} = "xp";
      }
   }
}


#------------------------------------------------------------------------------
# Funktion translate
# Übersetzt die Planeten Bezeichnungen
#------------------------------------------------------------------------------
sub translate {
   my %translate = ("Sun" => "Sonne", "Moon" => "Mond", "Mercury" => "Merkur", "Venus" => "Venus", "Mars" => "Mars", 
                    "Jupiter" => "Jupiter", "Saturn" => "Saturn", "Uranus" => "Uranus", "Neptune" => "Neptun", 
                    "Pluto" => "Pluto", "true Node" => "Mondknoten", "mean Apogee" => "Lilith");

   if ($translate{$_[0]} eq "") { return $_[0]; }
   else { return $translate{$_[0]}; }
}

#------------------------------------------------------------------------------
# Funktion ortssuche
# Liefert aus den Daten von openstreetmap Ortsvorschläge mit den
# Dazugehörigen Längen- und Breitengraden
#------------------------------------------------------------------------------
sub ortssuche {
   my $location = $_[0];
   my $jstr;
   my $count = 0;
   #foreach (@ARGV) { $location .= "%20".$_; }
   $location =~ s/^\%20//g;
   $location =~ s/\s/\%20/g;

   do {
      $jstr = `curl -H 'Accept-Language: de,en-US' https://nominatim.openstreetmap.org/search/$location?format=json 2> /dev/null`;
   } while ($jstr =~ /\<html\>/ && $count++ <= 3);
   #DEBUG:
   system ("echo $count >> /tmp/debug");
   my (@part1, @part2, @part3, $p1, $p2, $p3, %vals, $name);
   my $count = 0;

   $jstr =~ s/^\[\{//g;
   $jstr =~ s/[\[\]]//g;
   @part1 = split (/\},\{/,$jstr);
   foreach $p1 (@part1) {
      #print "$_\n\n";
      @part2 = split (/\",\"/,$p1);
      foreach $p2 (@part2) {
         $p2 =~ s/\"//g;
         if ($p2 =~ /^lat/ || $p2 =~ /^lon/ || $p2 =~ /^display_name/) {
            @part3 = split (/:/, $p2);
            $vals {$part3[0]} = $part3[1];
          }
      }
      if (length ($vals{display_name}) > 100) { $name = substr($vals{display_name},0,100)."..."; }
      else { $name = $vals{display_name}; }
      #printf ("<option>%3d: [ %7.2f %7.2f ] %s</option>\n", $count, $vals{lon}, $vals{lat}, $name);
      printf ("<option>[ %7.2f %7.2f ] %s</option>\n", $vals{lon}, $vals{lat}, $name);
      $count++;
   }
   exit;
}


#------------------------------------------------------------------------------
# Funktion ZoneDetect
# Liefert die UTC Zeit aus Lon und Lat
#------------------------------------------------------------------------------
sub ZoneDetect {
   my ($lon, $lat, $date, $time) = @_;
   my $bc = 0;
   if ($date =~ /\-/) { $bc = 1; }

   my $database = "/var/www/html/jaap/ZoneDetect/database/out/timezone21.bin";
   my $tz = `/var/www/html/jaap/ZoneDetect/demo $database $lat $lon`;

   my @p = split(/\n/, $tz);   
   my @p2;
   my ($prefix, $id, $lc, $bcj);   

   foreach (@p) {
      next if ($_ eq "");
      @p2 = split(/:/, $_);
      $p2[0] =~ s/^\s+|\s+$//g;
      $p2[1] =~ s/^\s+|\s+$//g;

      if ($p2[0] =~ /TimezoneIdPrefix/) { $prefix = $p2[1]; }
      if ($p2[0] =~ /TimezoneId/) { $id = $p2[1]; }
      if ($p2[0] =~ /CountryAlpha2/) { $lc = $p2[1]; }
   }   
   #return ($prefix.$id);
   my $zone = $prefix.$id;
 
   if ($date eq "" && $time eq "") {
      return ($zone);
   } 

   @p = split(/\./, $date);
   $time =~ s/\./\:/g;

   if ($bc) { $bcj = $p[2]; $p[2] = 1; }
 
   my $utcdate = `date -u --date='TZ="$zone" $p[1]/$p[0]/$p[2] $time' +%d.%m.%Y`;
   my $utctime = `date -u --date='TZ="$zone" $p[1]/$p[0]/$p[2] $time' +%H:%M`;
   my $diff = `TZ="$zone" date --date "$p[1]/$p[0]/$p[2] $time" +%z`;
   my $atza = `TZ="$zone" date --date "$p[1]/$p[0]/$p[2] $time" +%Z`;
 
   chomp($utcdate);
   chomp($utctime);
   chomp($diff);
   chomp($atza);
   $utctime =~ s/\:/\./g;
 
   if ($bc) { 
      @p = split(/\./, $utcdate);
      $utcdate = join('.', $p[0], $p[1], $bcj);
   }

   return (join(';', $utcdate, $utctime, $diff, $lc, $zone, $atza));
}


#------------------------------------------------------------------------------
# Funktion wuerden
# Schreibt die wuerden eines gefilterten Planeten auf den Bildschirm
#------------------------------------------------------------------------------
sub wuerden {
   my $planet_w = $_[0];
   my $rel;
   my (@multi, $mu, $ew, $spstat);
   my @mainpl = ("Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"); 
   my $skip = 1;
   my $found = 0;
   my $sty;
   
   my %EssWue = (
       Sun => {
           Domizil       => "loe",
           Exil          => "wma",
           Erhoehung     => "wid",
           Fall          => "wag",
           Triplizitaet  => "sch",
       },
       Moon => {
           Domizil       => "kre",
           Exil          => "stb",
           Erhoehung     => "sti",
           Fall          => "sko",
           Triplizitaet  => "fis",
       },
       Mercury => {
           Domizil       => "zwi:jfr",
           Exil          => "sch:fis",
           Erhoehung     => "jfr",
           Fall          => "fis",
           Triplizitaet  => "wag:wma:sti:stb",
       },
       Venus => {
           Domizil       => "sti:wag",
           Exil          => "sko:wid",
           Erhoehung     => "fis",
           Fall          => "jfr",
           Triplizitaet  => "stb:zwi:wma",
       },
       Mars => {
           Domizil       => "wid:sko",
           Exil          => "wag:sti",
           Erhoehung     => "stb",
           Fall          => "kre",
           Triplizitaet  => "loe:sch",
       },
       Jupiter => {
           Domizil       => "sch:fis",
           Exil          => "zwi:jfr",
           Erhoehung     => "kre",
           Fall          => "stb",
           Triplizitaet  => "wid:loe",
       },
       Saturn => {
           Domizil       => "stb:wma",
           Exil          => "kre:loe",
           Erhoehung     => "wag",
           Fall          => "wid",
           Triplizitaet  => "sti:jfr",
       },
       Uranus => {
           Domizil       => "wma",
           Exil          => "loe",
           Erhoehung     => "sko",
           Fall          => "sti",
           Triplizitaet  => "zwi:wag",
       },
       Neptune => {
           Domizil       => "fis",
           Exil          => "jfr",
           Erhoehung     => "kre",
           Fall          => "stb",
           Triplizitaet  => "sko",
       },
       Pluto => {
           Domizil       => "sko",
           Exil          => "sti",
           Erhoehung     => "loe",
           Fall          => "wma",
           Triplizitaet  => "kre:fis",
       },
   ); 


   if (!$transit) { $rel = relative_deg ($planets{$planet_w}); }
   else { $rel = relative_deg ($planets_tr{$planet_w}); }

   my @p = split (/\s+/, $rel);
   my $tkz = $p[1];

   foreach (@mainpl) { if ($_ eq $planet_w) { $skip = 0; }}

   print "<div class=\"wuerden\">\n<h4>$transpl ($pl_h{$planet_w}. Haus)</h4>\n";
   if (!$skip) {
      foreach $ew (keys %{$EssWue{$planet_w}}) {
         if ($EssWue{$planet_w}{$ew} =~ /:/) {
            @multi = split (/:/, $EssWue{$planet_w}{$ew});
            foreach $mu (@multi) { 
               if ($mu eq $tkz) { 
                  $sty = get_style ("ess", $ew);
                  $ew =~ s/oe/ö/g;
                  $ew =~ s/ae/ä/g;
                  print "$sty $ew</div>\n";
                  $found = 1;
               }
            }
         }
         else {
            if ($EssWue{$planet_w}{$ew} eq $tkz) { 
               $sty = get_style ("ess", $ew);
               $ew =~ s/oe/ö/g;
               $ew =~ s/ae/ä/g;
               print "$sty $ew</div>\n";
               $found = 1;
            }
         }
      }
      if (!$found) { 
         $sty = get_style ("ess", "Peregrin");
         print "$sty Peregrin</div>\n";
      }
   }

   # Läufigkeit und Gewchwindigkeit
   if (!$transit) {
      if ($rueckl{$planet_w} eq "R") {
         $sty = get_style ("akz", "rueck");
         print "$sty rückläufig</div>\n";
      }
      else {
         $sty = get_style ("akz", "direkt");
         print "$sty direktläufig</div>\n";
      }
      $spstat = get_spstat($planet_w);
      if ($spstat ne "") {
         $sty = get_style ("akz", $spstat);
         print "$sty $spstat</div>\n";
      }
      
      $speed{$planet_w} =~ s/\.\d\d\d\d//g;
      print "&nbsp;&nbsp;&nbsp;Geschw.: $speed{$planet_w}/Tag\n";
   }


   else {
      if ($rueckl_tr{$planet_w} eq "R") {
         $sty = get_style ("akz", "rueck");
         print "$sty rückläufig</div>\n";
      }
      else {
         $sty = get_style ("akz", "direkt");
         print "$sty direktläufig</div>\n";
      }
      $spstat = get_spstat($planet_w);
      if ($spstat ne "") {
         $sty = get_style ("akz", $spstat);
         print "$sty $spstat</div>\n";
      }
      $speed_tr{$planet_w} =~ s/\.\d\d\d\d//g;
      print "&nbsp;&nbsp;&nbsp;Geschw.: $speed_tr{$planet_w}/Tag\n";
   }

   print "</div>\n";

}

#------------------------------------------------------------------------------
# Funktion get_spstat
# Ermittelt ob ein Planet langsam oder schnell ist
#------------------------------------------------------------------------------
sub get_spstat {

   if ($_[0] eq "Sun" || $_[0] eq "Moon") { return ""; }

   my $x;
   if (!$transit) { $x = $speed{$_[0]}; }
   else { $x = $speed_tr{$_[0]}; }
   $x =~ s/\-//g;
   my $plsp = get_ang ($x);

   my %max_speed = ("Mercury" => "2°07’26", "Venus" => "1°15’18", "Mars" => "0°45’22", "Jupiter" => "0°14’31",
                   "Saturn" => "0°07’11", "Uranus" => "0°03’27", "Neptune" => "0°02’16", "Pluto" => "0°01’58");

   my $maxsp = get_ang ($max_speed{$_[0]});

   my $station = $maxsp/100*3;
   my $slow = $maxsp/100*20;
   my $fast = $maxsp/100*80; 


   if ($plsp <= $station) { return "stationär"; } 
   elsif ($plsp >= $fast) { return "schnell"; } 
   elsif ($plsp <= $slow) { return "langsam"; } 
   else { return ""; }
}


#------------------------------------------------------------------------------
# Funktion get_style
# generiert den styletag für die Planeten Informationen
#------------------------------------------------------------------------------
sub get_style {
   # essentiell
   if ($_[0] eq "ess") {
      if ($_[1] eq "Domizil" || $_[1] eq "Triplizitaet" || $_[1] eq "Erhoehung") {
         return "<div style=\"color:#007000; font-weight:bold\">+ ";
      }
      elsif ($_[1] eq "Peregrin") {
         return "<div style=\"color:#ff9900; font-weight:bold\">– ";
      }
      elsif ($_[1] eq "Fall" || $_[1] eq "Exil") {
         return "<div style=\"color:#ff0000; font-weight:bold\">– ";
      }
      else {
         return "<div>";     
      }
   }

   # Akzident
   if ($_[0] eq "akz") {
      if ($_[1] eq "rueck" || $_[1] eq "langsam" || $_[1] eq "stationär") {
         return "<div style=\"color:#ff0000\">– ";
      }
      elsif ($_[1] eq "direkt" || $_[1] eq "schnell") {
         return "<div style=\"color:#007000\">+ ";
      }
   }
}

#------------------------------------------------------------------------------
# Funktion Hinweis
# Bledet einen Hinweistext zu einem Transit ein
#------------------------------------------------------------------------------
sub hinweis {
   my %abk = ("Sun" => "SO", "Moon" => "MO", "Mercury" => "ME", "Venus" => "VE", "Mars" => "MA", "Jupiter" => "JU", 
              "Saturn" => "SA", "Uranus" => "UR", "Neptune" => "NE", "Pluto" => "PL", "true Node" => "KN", "Ascendant" => "AC", "MC" => "MC");
   my $cmd;
   my @p = split (/\:/, $_[0]);
   if ($abk{$p[0]} eq "" || $p[1] eq "" || $abk{$p[2]} eq "") {
      print " - Kein Eintrag - "; exit;
   }
   my $aspstr = join (' ', $abk{$p[0]}, $p[1], $abk{$p[2]});

   #print "DEBUG: Funktion hinweis aufgerufen\nAspect $aspstr wird angezeigt\n";
   if ($transit) { print "Transit: "; $cmd = `grep "$aspstr" transit.txt | cut -d ";" -f2`; }
   else { $cmd = `grep "$aspstr" radix.txt | cut -d ";" -f2`; }
   print "$aspstr\n\n";
   print "$cmd";

   exit;
}


#------------------------------------------------------------------------------
# Funktion draw_smart
# Erzeugt die Kontrollen für den Smartmode
#------------------------------------------------------------------------------
sub draw_smart {
   print "<div id=\"smart\">\n";

   if ($transit) {
      print "<button class=\"sm\" id=\"sm_r\" onclick=\"restore_radix()\">R</button><br />\n";
   }

   if ($radix) {
      print "<button class=\"sm\" id=\"sm_t\" onclick=\"set_transit()\">T</button><br />\n";
   }

   if (!$transit) {
      print "<button class=\"sm\" id=\"sm_load\" onclick=\"set_open()\">L</button><br />\n";
      print "<button class=\"sm\" id=\"sm_new\" onclick=\"smart_n()\">N</button><br />\n";
   }

   if (!$radix) {
      print "<button class=\"sm\" id=\"sm_st\" onclick=\"setval('offset','Stunde', 'offset');setval('mult', 1, 'multi')\">1S</button><br />\n";
      print "<button class=\"sm\" id=\"sm_tag\" onclick=\"setval('offset','Tag', 'offset');setval('mult', 1, 'multi')\">1T</button><br />\n";
      print "<button class=\"sm\" id=\"sm_mon\" onclick=\"setval('offset','Monat', 'offset');setval('mult', 1, 'multi')\">1M</button><br />\n";
      print "<button class=\"sm\" id=\"sm_j\" onclick=\"setval('offset','Jahr', 'offset');setval('mult', 1, 'multi')\">1J</button><br />\n";
      print "<button class=\"sm\" id=\"sm_plus\" onclick=\"set_offs('plus')\">+</button><br />\n";
      print "<button class=\"sm\" id=\"sm_minus\" onclick=\"set_offs('minus')\">–</button><br />\n";
   }

   print "<button class=\"sm\" id=\"sm_home\" onclick=\"reset()\">!</button><br />\n";

   print "</div>\n";

}	

#------------------------------------------------------------------------------
# Funktion neu_dialog
# Erzeugt das Dialogfenster für ein neues Radix
#------------------------------------------------------------------------------
sub neu_dialog {

   print "<!-- Neu Dialog -->\n<div id=\"neuradix\" class=\"dialog\">\n";
   print "<!-- Neu Dialog content -->\n<div class=\"dialog-content\">\n<span class=\"close\">&times;</span>\n";
   #print "<input type=\"hidden\" id=\"rdx\" name=\"radix\" value=\"1\">\n";
   print "<table class=\"out\">\n";
   print "<tr>\n<td colspan=\"4\" class=\"noborder\">\n<b>Neues Radix berechnen</b>\n</td>\n</tr>\n";
   print "<tr>\n<td colspan=\"4\" class=\"noline\">Name:\n";
   print "<input type=\"text\" name=\"name\" class=\"text\" id=\"getname\" />\n</td>\n</tr>\n";
   print "<tr>\n<td class=\"noline_sh\">Datum:\n<input type=\"date\" name=\"datum\" class=\"htext\" id=\"getdate\" />\n</td>\n";
   print "<td colspan=\"3\" class=\"noline\">Uhrzeit:\n<input type=\"time\" name=\"uhrzeit\" class=\"htext\" id=\"gettime\"/>\n</td>\n</tr>\n";


   print "<tr>\n<td class=\"noline_sh\">\nOrt:\n<input type=\"text\" name=\"ort\" class=\"otext\" id=\"ortstr\" />\n";
   print "<td colspan=\"3\" class=\"noline\">\n<a class=\"sbtn\" href=\"javascript:searchlocation()\" />suchen</a>\n</td>\n</tr>\n";



   print "<tr>\n<td colspan=\"4\" class=\"noline\">\n";
   print "<select name=\"ortlist\" size=\"5\" id=\"olist\" onchange=\"set_lola()\" multiple>\n";
   print "</select>\n</td>\n</tr>\n";



   print "<tr>\n<td class=\"noline_sh\">Long:\n<input type=\"text\" name=\"long\" id=\"long\" class=\"htext\" />\n</td>\n";
   print "<td class=\"noline\">Lat:\n<input type=\"text\" name=\"lat\" id=\"lat\" class=\"htext\" />\n</td>\n";
   print "<td class=\"noline_c\"><input type=\"checkbox\" name=\"bc\" id=\"vchr\" class=\"bc\" value=\"bc\"/</td>\n";
   print "<label for=\"vchr\">bc</label>\n";
   print "<td class=\"noline_c\"><a href=\"javascript:set_home_loc()\" class=\"sethome\">🏡</a></td></tr>\n";

   #print "<input type=\"hidden\" id=\"hsys\" name=\"hsys\">\n";

   print "<tr><td colspan=\"2\" class=\"noborder\">\n<button class=\"button1\" id=\"subf\" onclick=\"newradix()\">OK</button>\n</td>\n</tr>\n";
   print "</table>\n</div>\n</div>\n";

}


#------------------------------------------------------------------------------
# Funktion open_dialog
# Erzeugt das Dialogfenster für radix laden
#------------------------------------------------------------------------------
sub open_dialog {

   print "<!-- Open Dialog -->\n<div id=\"openradix\" class=\"dialog_open\">\n";
   print "<!-- Open Dialog content -->\n<div class=\"dialog_open-content\">\n<span class=\"close_open\">&times;</span>\n";
   print "<p class=\"sl\"><b>Radix laden</b></p>\n";

   print "<table class=\"out\">\n";
   print "<tr>\n<td colspan=\"2\" class=\"noline\">\n";
   print "<select name=\"loadlist\" size=\"15\" id=\"llist\" onclick=\"set_load()\" multiple>\n";
   print "</select>\n</td>\n</tr>\n</table>\n</div>\n</div>\n";


}

#------------------------------------------------------------------------------
# Funktion open_about
# Erzeugt das Dialogfenster für about informationen
#------------------------------------------------------------------------------
sub open_about {

   print "<!-- about Dialog -->\n<div id=\"openabout\" class=\"dialog_about\">\n";
   print "<!-- about Dialog content -->\n<div class=\"dialog_about-content\">\n";
   print "<p class=\"sl\"><b>jaap ($version)</b></p>\n";

   print "<table class=\"out\">\n";
   print "<tr>\n<td colspan=\"2\" class=\"noline\">\n";

   print "<div class=\"gnu\">Copyright (C) 2019 Armin Warias.<br />\nFür jaap besteht KEINERLEI GARANTIE. ";
   print "klicke <a href=\"https://www.gnu.org/licenses/gpl-3.0\" target=\"_blank\"> hier</a> für Details.<br />"; 
   print "jaap ist freie Software, die du unter bestimmten Bedingungen weitergeben darfst. ";
   print "klicke <a href=\"https://www.gnu.org/licenses/gpl-3.0#terms\" target=\"_blank\"> hier </a> für Details</div>\n";

   print "<ul class=\"features\">";
   print "<li>Jaap Quellcode herunterladen <a href=\"https://github.com/wariasar/jaap\" target=\"_blank\">(GitHub)</a></li>\n";
   print "<li>Astrologische Daten vom Astrodienst <a href=\"https://www.astro.com/swisseph/swephinfo_e.htm\" target=\"_blank\"> (Swiss Ephemeris)</a></li>\n";
   #print "<li>Ortsdaten von openstreetmap <a href=\"https://nominatim.openstreetmap.org/\"> (Nominatim)</a></li>\n";
   #print "<li>Zeitzonen Ermittlung mit<a href=\"https://github.com/BertoldVdb/ZoneDetect\"> (ZoneDetect)</a></li>\n";
   #print "<li>Zeitzonen Umrechnung mit<a href=\"https://www.iana.org/time-zones/\"> (tzdb)</a></li>\n";
   print "</ul>";

   print "<div class=\"note_about\">";
   print "<p><strong>Hinweis: </strong>Damit du deinen Heimatstandort nicht immer wieder neu eingeben musst, "; 
   print "wird dieser im Local Storage deines Browsers gespeichert. Ebenso dein bevorzugtes Häusersystem. ";
   print "Wenn du Horoskope abspeicherst oder importierst, werden diese in der Indexed DB deines Browsers gespeichert. "; 
   print "Diese Daten kannst du jederzeit selbst wieder löschen. <a href=\"help.html#doc_del\" target=\"_blank\">(Dokumentation)</a></p></div>"; 
   print "<a href=\"datenschutz.html\" target=\"_blank\">Datenschutz</a>&nbsp;\n";
   print "<a href=\"impressum.html\" target=\"_blank\">Impressum</a></div>\n";

   print "</td>\n</tr>\n</table>\n";
   print "<p class=\"ih\"><button class=\"button1\" onclick=\"close_about()\">OK</button>\n</p></div>\n</div>\n\n";   
}


#------------------------------------------------------------------------------
# Funktion textbox
# Erzeugt das Dialogfenster für eine Textbox
#------------------------------------------------------------------------------
sub textbox {

   print "<!-- Textbox -->\n<div id=\"tebo\" class=\"textbox\">\n";
   print "<!-- Textbox content -->\n<div class=\"textbox-content\">\n<span class=\"close_tb\">&times;</span>\n";
   print "<p class=\"sl\"><b></b></p>\n";

   print "<table class=\"out\">\n";
   print "<tr>\n<td colspan=\"2\" class=\"noline\">\n";

   print "<form id = \"txtform\"><textarea readonly id=\"tbi\">Kein Text für vorhanden</textarea></form>\n";

   print "</td>\n</tr>\n</table>\n</div>\n</div>";

}


#------------------------------------------------------------------------------
# Funktion submenue
# Erzeugt das sandwitchmenue
#------------------------------------------------------------------------------
sub submenue {

   print "<div id=\"dropdown\" class=\"dropdown-content\">\n";
   #print "<a href=\"javascript:set_open()\"><img src=\"icons/open.png\" class=\"icon\">Laden</a>\n";
   #print "<a href=\"javascript:save()\"><img src=\"icons/save.png\" class=\"icon\">Speichern</a>\n";
   #print "<a href=\"javascript:import_aaf()\"><img src=\"icons/db_in.png\" class=\"icon\">AAF Import</a>\n";
   #print "<a href=\"javascript:export_db()\"><img src=\"icons/db_out.png\" class=\"icon\">AAF Export</a>\n";
   #print "<a id=\"btn_hlp\" href=\"help.html\"><img src=\"icons/help.png\" class=\"icon\">Hilfe</a>\n";
   #print "<a id=\"btn_about\" href=\"javascript:show_about()\"><img src=\"icons/about.png\" class=\"icon\">Über</a>\n";
   print "<a href=\"javascript:set_open()\">📤 Laden</a>\n";
   print "<a href=\"javascript:save()\">📥 Speichern</a>\n";
   print "<a href=\"javascript:import_aaf()\">📂 AAF Import</a>\n";
   print "<a href=\"javascript:export_db()\">💾 AAF Export</a>\n";
   print "<a id=\"btn_delete\" href=\"javascript:delete_all_data()\">💣 Löschen…</a>\n";
   print "<a id=\"btn_hlp\" href=\"help.html\" target=\"_blank\">🔎 Hilfe</a>\n";
   print "<a id=\"btn_about\" href=\"javascript:show_about()\">💬 Über</a>\n";
   print "</div>\n";
}
