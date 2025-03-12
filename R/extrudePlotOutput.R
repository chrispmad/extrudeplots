#' Display a rendered Three.js Extrude Plot
#'
#' @param outputId Unique ID to link render and output functions
#' @param height Height of widget; can use 'px' or '%'
#' @param width Width of widget; can use 'px' or '%'
#' @param style Additional CSS style arguments
#'
#' @returns Widget for UI of Shiny app, tied to a renderExtrudePlot by shared outputId.
#' @export
extrudePlotOutput = function(outputId = NULL, height = '500px', width = '100%', style = "border:none;"){
  if(is.null(outputId)) stop("outputId must be named for extrudePlotOutput()")
  tags$iframe(
    id = outputId,
    # `data-outputid` = outputId,
    # src = paste0("extrude_plot_widget.html?id=",outputId),
    src = paste0('/extrudeplots/html/extrude_plot_widget.html?id=',outputId),
    height = height,
    width = width,
    style = style
  )
}
