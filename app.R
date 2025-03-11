library(shiny)
library(bslib)
library(htmltools)

extrudePlotOutput = function(outputId = NULL, height = '500px', width = '100%', style = "border:none;"){
  if(is.null(outputId)) stop("outputId must be named for extrudePlotOutput()")
  tags$iframe(
    id = outputId,
    #name = outputId,
    `data-outputid` = outputId,
    src = paste0("extrude_plot_widget.html?id=",outputId),
    height = height,
    width = width,
    style = style
  )
}

renderExtrudePlot = function(outputId = NULL, dat, label_col = NULL, height_col = NULL, session){
  observe({
    if(is.null(outputId)) stop("outputId must be named for renderExtrudePlot()")
    if(is.null(session)) stop("session must be 'session = session'")
    if(is.reactive(dat)) dat = dat()
    if(is.null(label_col)){
      if('label' %in% names(dat)) {
        label_col = 'label' # Check for obvious labelling
      } else {
        stop("label_col cannot be NULL for renderExtrudePlot()")
      }
    }
    if(is.null(height_col)){
      if('label' %in% names(dat)) {
        height_col = 'label' # Check for obvious labelling
      } else {
        stop("height_col cannot be NULL for renderExtrudePlot()")
      }
    }
    dat = dat |>
      dplyr::rename(label = !!rlang::sym(label_col),
                    height = !!rlang::sym(height_col))
    # If no reactiveVal exists for this outputId to track first data send, create it.
    if(!exists(paste0('first_data_send_',outputId), envir = session$userData)){
      # Create first_data_send reactive and ship it to global env
      session$userData[[paste0('first_data_send_',outputId)]] <- reactiveVal(FALSE)
      print(paste0("Using reactiveVal first_data_send_",outputId))
    }
    # Send data first time to main.js
    if(session$userData[[paste0('first_data_send_',outputId)]]() == F){
      dat_to_send = dat |>
        geojsonio::geojson_list(auto_unbox = T)
      session$sendCustomMessage("geojsonData", list(
        iframeID = outputId,
        data = dat_to_send
      ))
      session$userData[[paste0('first_data_send_',outputId)]](T)
    } else {
      # Geometries have been sent; just send height updates.
      session$sendCustomMessage("heightData", list(
        iframeID = outputId,
        data = dat |> dplyr::select(label, height)
      ))
    }
  })
}

ui <- page_fillable(
  layout_sidebar(
    height = '100%',
    mainPanel(
      width = 12,
      card(
        h3("Main Panel"),
        bslib::layout_column_wrap(
          1/2,
          card(
            h5('A'),
            extrudePlotOutput('nr_regs')
          ),
          card(
            h5('B'),
            extrudePlotOutput('nr_regs_b')
          )
        )
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
        ),
        shiny::checkboxGroupInput(
          'cols_to_include_b',
          label = "Columns to Include B",
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

  dt = sf::read_sf('dt.gpkg')

  dt_l = reactive({
    req(!is.null(input$cols_to_include))
    height_sum_tbl = dt |>
      sf::st_drop_geometry() |>
      dplyr::select(label, input$cols_to_include) |>
      tidyr::pivot_longer(cols = -label) |>
      dplyr::group_by(label) |>
      dplyr::reframe(height = sum(value))

    dt |>
      dplyr::left_join(
        height_sum_tbl,
        by = dplyr::join_by(label)
      )
  })

  dt_l_2 = reactive({
    req(!is.null(input$cols_to_include))
    height_sum_tbl = dt |>
      sf::st_drop_geometry() |>
      dplyr::select(label, input$cols_to_include) |>
      tidyr::pivot_longer(cols = -label) |>
      dplyr::group_by(label) |>
      dplyr::reframe(height = sum(value))

    dt |>
      dplyr::left_join(
        height_sum_tbl,
        by = dplyr::join_by(label)
      )
  })
  renderExtrudePlot(outputId = "nr_regs", dt_l, label_col = "label", height_col = 'height', session = session)
  renderExtrudePlot(outputId = "nr_regs_b", dt_l_2, label_col = "label", height_col = 'height', session = session)
}

shinyApp(ui, server)
