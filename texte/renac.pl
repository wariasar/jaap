#!/usr/bin/perl

use strict;

open (AC, "ac.txt") or die ($!);
while (<AC>) {
   chomp ($_);
   my $old = $_;
   $_ =~ s/_Ascendent/_Ascendant/g;
   my $cmd = "mv $old $_";
   print "$cmd\n";
   system ($cmd); 
}
