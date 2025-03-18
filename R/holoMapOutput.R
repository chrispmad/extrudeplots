#' Display a rendered Three.js Holo Map
#'
#' @param outputId Unique ID to link render and output functions
#' @param height Height of widget; can use 'px' or '%'
#' @param width Width of widget; can use 'px' or '%'
#' @param style Additional CSS style arguments
#'
#' @returns Widget for UI of Shiny app, tied to a renderHoloMap by shared outputId.
#' @export
holoMapOutput = function(outputId = NULL, height = '500px', width = '100%', style = "border:none;"){
  if(is.null(outputId)) stop("outputId must be named for holoMapOutput()")
  tags$iframe(
    id = outputId,
    src = paste0('/extrudeplots/html/holo_map_widget.html?id=',outputId),
    height = height,
    width = width,
    style = style
  )
}
