#' Render a Three.js Extrude Plot widget
#'
#' @param outputId Unique ID to link render and output functions
#' @param dat Data to use in extrude plot
#' @param label_col Column name to use to label extrudes
#' @param height_col Column name that should be used to inform height of extrudes
#' @param session Shiny session; should just say session = session
#'
#' @returns One half of a Shiny-compatible render and output combo. You don't need to assign this to Shiny's output list
#' @export
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
      session$sendCustomMessage(paste0("geojsonData_",outputId), list(
        iframeID = outputId,
        data = dat_to_send
      ))
      session$userData[[paste0('first_data_send_',outputId)]](T)
    } else {
      # Geometries have been sent; just send height updates.
      session$sendCustomMessage(paste0("heightData_",outputId), list(
        iframeID = outputId,
        data = dat |> dplyr::select(label, height)
      ))
    }
  })
}
