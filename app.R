library(shiny)
library(bslib)
library(htmltools)

extrudePlotOutput = function(outputId = NULL, height = '500px', width = '100%', style = "border:none;"){
  if(is.null(outputId)) stop("outputId must be named for extrudePlotOutput()")
  tags$iframe(
    src = "extrude_plot_widget.html",
    height = height,
    width = width,
    style = style
  )
}

# renderExtrudePlot = function(outputId = NULL, dat, label_col = NULL, height_col = NULL){
#   if(is.null(outputId)) stop("outputId must be named for renderExtrudePlot()")
#   if(is.reactive(dat)) dat = dat()
#   if(is.null(label_col)){
#     if('label' %in% names(dat)) label_col = 'label'
#   } else {
#     stop("label_col cannot be NULL for renderExtrudePlot()")
#   }
#   if(is.null(label_col)){
#     if('height' %in% names(dat)) label_col = 'height'
#   } else {
#     stop("height_col cannot be NULL for renderExtrudePlot()")
#   }
#
#   # Sum up columns
#   height_sum_tbl = dt |>
#     sf::st_drop_geometry() |>
#     dplyr::select(label, input$cols_to_include) |>
#     tidyr::pivot_longer(cols = -label) |>
#     dplyr::group_by(label) |>
#     dplyr::reframe(height = sum(value))
#
#   # Send full data, i.e. with geometry, if main.js does not yet
#   # have the geometry.
#   dt |>
#     dplyr::left_join(
#       height_sum_tbl,
#       by = dplyr::join_by(label)
#     )
# }

ui <- page_fillable(
  layout_sidebar(
    height = '100%',
    mainPanel(
      width = 12,
      card(
        h3("Main Panel"),
        extrudePlotOutput('nr_regs_explot')
      )
    ),
    sidebar = sidebar(
      card(
        h5("Sidebar"),
        shiny::checkboxGroupInput(
          'cols_to_include',
          label = "Columns to Include",
          choices = c("col_a","col_b"),
          selected = c("col_a","col_b")
        )
      )
    )
  )
)

server <- function(input, output, session) {

  # Set the working directory to the www folder (if not already)
  if(!stringr::str_detect(getwd(),"www$")) setwd(paste0(getwd(),"/www"))

  # dt = bcmaps::nr_regions() |>
  #   sf::st_buffer(dist = -1000) |>
  #   sf::st_transform(4326) |>
  #   rmapshaper::ms_simplify(keep = 0.01) |>
  #   dplyr::select(label = REGION_NAME)
  #
  # dt$col_a = sample(x = c(1:5), size = nrow(dt), replace = T)
  # dt$col_b = sample(x = c(1:5), size = nrow(dt), replace = T)
  # sf::write_sf(dt, "www/dt.gpkg")
  dt = sf::read_sf('dt.gpkg')

  first_data_send = reactiveVal(F)

  dt_l = reactive({
  req(!is.null(input$cols_to_include))
    height_sum_tbl = dt |>
      sf::st_drop_geometry() |>
      dplyr::select(label, input$cols_to_include) |>
      tidyr::pivot_longer(cols = -label) |>
      dplyr::group_by(label) |>
      dplyr::reframe(height = sum(value))

    print(height_sum_tbl)
    # Send full data, i.e. with geometry, if main.js does not yet
    # have the geometry.
    dt |>
      dplyr::left_join(
        height_sum_tbl,
        by = dplyr::join_by(label)
      )
  })

  # Has the data never been sent? Send it now!
  observe({
    req(first_data_send() == F)
    # req(input$cols_to_include != list())
    dat_to_send = dt_l() |>
      geojsonio::geojson_list(auto_unbox = T)
    session$sendCustomMessage("geojsonData", dat_to_send)
    # geojsonio::geojson_write(dat_to_send,"extrude_dat.geojson")
    first_data_send(T)
    print("sending full geometry data to main.js")
  })

  # Send data to main.js! Either with geometry or just height values
  observe({
    req(first_data_send())
    # req(input$cols_to_include != list())
    print("sending height data to main.js")
    # print(dt_l())
    # Full data with geometries has been sent once.
    req(!is.null(input$cols_to_include))
    session$sendCustomMessage("heightData", dt_l() |> dplyr::select(label, height))
  })

  # output$my_plot <- renderUI({
  #   # req(!is.null(input$cols_to_include))
  #   shiny::isolate({
  #     tags$iframe(
  #       src = "index_trimmed_test.html",  # Your Three.js visualization
  #       height = "500px",
  #       width = "100%",
  #       style = "border:none;"  # Optional: Remove border for a cleaner look
  #     )
  #   })
  # })

  # Keep an ear out to listen for a message from main.js that
  # indicates the geometry arrived successfully.
  # observe({
  #   print(input$geometryReceived)
  #   req(input$geometryReceived)
  #   if(input$geometryReceived) {
  #     # Data was successfully received in JavaScript
  #     data_received(TRUE)
  #   }
  # })
}

shinyApp(ui, server)
