library(shiny)
library(bslib)
library(htmltools)
library(extrudeplots)

ui <- page_fillable(
  layout_sidebar(
    height = '100%',
    mainPanel(
      width = 12,
      card(
        h3("Main Panel"),
        bslib::layout_column_wrap(
          width = 1/2,
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

  dt = extrudeplots::dt

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
    req(!is.null(input$cols_to_include_b))
    height_sum_tbl = dt |>
      sf::st_drop_geometry() |>
      dplyr::select(label, input$cols_to_include_b) |>
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
