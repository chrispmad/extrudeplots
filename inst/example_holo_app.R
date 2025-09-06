library(shiny)
library(bslib)
library(htmltools)
library(extrudeplots)
library(sf)
library(elevatr)

ui <- page_fillable(
  layout_sidebar(
    height = '100%',
    mainPanel(
      width = 12,
      "Vancouver LiDAR",
      layout_column_wrap(
        holoMapOutput('vancouver')#,
        # holoMapOutput('victoria')
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

  # van = terra::rast("C:/Users/CMADSEN/Downloads/LocalR/one_off_projects/vancouver_lidar/output/van_dt_lowres.tif")
  van = terra::rast("www/van_dt_lowres.tif")

  van_json = van |>
    matrix(nrow = terra::nrow(van), byrow = T) |>
    jsonlite::toJSON()

  # vic = st_as_sf(
  #   data.frame(lat = c(48.40291859176319,48.444245849363824),
  #              lng = c(-123.32937524737241,-123.39061727101604)),
  #   coords = c('lng','lat'),
  #   crs = 4326) |>
  #   sf::st_bbox() |> sf::st_as_sfc() |> sf::st_as_sf()

  # vic_el = elevatr::get_elev_raster(vic, z = 14, clip = 'bbox')
  # vic_el = terra::clamp(vic_el, lower = 0)
  # terra::writeRaster(vic_el, filename = "C:/Users/CMADSEN/Downloads/LocalR/one_off_projects/vancouver_lidar/output/victoria_elevation.tif",
  #                    overwrite = T)

  # vic = terra::rast("C:/Users/CMADSEN/Downloads/LocalR/one_off_projects/vancouver_lidar/output/victoria_elevation.tif")
  #
  # vic_json = vic |>
  #   matrix(nrow = terra::nrow(vic_el), byrow = T) |>
  #   jsonlite::toJSON()

  renderHoloMap(outputId = "vancouver", van_json, session = session)
  # renderHoloMap(outputId = "victoria", vic_json, session = session)
}

shinyApp(ui, server)
