#include <stdio.h>
#include "swephexp.h"

int main(int argc, char *argv[]) {
   swe_set_ephe_path("");

   double jd = swe_julday(2021, 3, 1, 0, SE_GREG_CAL);
   double jx = swe_solcross_ut(270,jd,0);

   printf("%f\n", jx);


}
