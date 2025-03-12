.onLoad <- function(libname, pkgname) {
  shiny::addResourcePath("extrudeplots", system.file("www", package = pkgname))
}
