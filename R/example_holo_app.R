#' Render Example Holo App
#'
#' @returns An interactive shiny app of Vancouver's download LiDAR
#' @export
#'
#' @examples
#' example_holo_app()
example_holo_app = function(){
  require(shiny)
  require(bslib)
  require(htmltools)
  require(extrudeplots)
  require(sf)
  require(elevatr)

  ui <- page_fillable(
    layout_sidebar(
      height = '100%',
      mainPanel(
        width = 12,
        "Vancouver LiDAR",
        layout_column_wrap(
          holoMapOutput('vancouver')
        )
      ),
      sidebar = sidebar(
        card(
          h5("Sidebar")
        )
      )
    )
  )

  server <- function(input, output, session) {

    if(file.exists(paste0(getwd(),"/inst/www/van_dt_lowres.tif"))){
      van = terra::rast("inst/www/van_dt_lowres.tif")
    } else {
      message("Using as package; let's see if Van LiDAR file can be found.")
      van = terra::rast(system.file("www/van_dt_lowres.tif", package = "extrudeplots"))
      message(van)
    }

    van_json = van |>
      matrix(nrow = terra::nrow(van), byrow = T) |>
      jsonlite::toJSON()

    renderHoloMap(outputId = "vancouver", van_json, session = session)
  }

  shinyApp(ui, server)
}
