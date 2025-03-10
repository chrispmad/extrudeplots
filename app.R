library(shiny)
library(bslib)
library(htmltools)

ui <- page_fillable(
  shiny::includeScript("https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/"),
  shiny::includeScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"),
  layout_sidebar(
    height = '100%',
    mainPanel(
      width = 12,
      card(
        h3("Main Panel")
      ),
      # uiOutput('my_plot')
      tags$iframe(
        src = "index_trimmed.html",  # Your Three.js visualization
        height = "500px",
        width = "100%",
        style = "border:none;"  # Optional: Remove border for a cleaner look
      )
      # shiny::selectInput('geometryReceived',label = '',choices = c(T,F), selected = F)#,
      # tags$iframe(src = "index_trimmed.html", height = 500, width = '100%')
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

  dt = bcmaps::nr_regions() |>
    sf::st_buffer(dist = -1000) |>
    sf::st_transform(4326) |>
    rmapshaper::ms_simplify(keep = 0.01) |>
    dplyr::select(label = REGION_NAME)

  dt$col_a = sample(x = c(1:5), size = nrow(dt), replace = T)
  dt$col_b = sample(x = c(1:5), size = nrow(dt), replace = T)

  data_received = reactiveVal(F)
  # data_sent = reactiveVal(F)

  dt_l_runs = reactiveVal(0)

  dt_l = reactive({
    shiny::isolate(dt_l_runs(dt_l_runs() + 1))
    shiny::isolate(print(paste0("dt_l has run ",dt_l_runs()," times.")))

    # print(paste("Current cols_to_include:", paste(input$cols_to_include, collapse=", ")))
    # req(input$cols_to_include)

    height_sum_tbl = dt |>
      sf::st_drop_geometry() |>
      dplyr::select(label, col_a, col_b) |>
      # dplyr::select(label, input$cols_to_include) |>
      tidyr::pivot_longer(cols = -label) |>
      dplyr::group_by(label) |>
      dplyr::reframe(height = sum(value))

    # Send full data, i.e. with geometry, if main.js does not yet
    # have the geometry.
    dt |>
      dplyr::left_join(
        height_sum_tbl,
        by = dplyr::join_by(label)
      )
  })

  # Send data to main.js! Either with geometry or just height values
  observe({
    req(dt_l())
    print("data_received is FALSE")
    dat_to_send = dt_l() |>
      geojsonio::geojson_list(auto_unbox = T)
    session$sendCustomMessage("geojsonData", dat_to_send)
  })

  # output$my_plot <- renderUI({
  #   browser()
  #   shiny::isolate({
  #     tags$iframe(
  #       src = "index_trimmed.html",  # Your Three.js visualization
  #       height = "500px",
  #       width = "100%",
  #       style = "border:none;"  # Optional: Remove border for a cleaner look
  #     )
  #   })
  # })

  # Keep an ear out to listen for a message from main.js that
  # indicates the geometry arrived successfully.
  observe({
    print(input$geometryReceived)
    req(input$geometryReceived)
    if(input$geometryReceived) {
      # Data was successfully received in JavaScript
      data_received(TRUE)
    }
  })
}

shinyApp(ui, server)
