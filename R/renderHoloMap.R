#' Render a Three.js Holo Map widget
#'
#' @param outputId Unique ID to link render and output functions
#' @param dat Data to use in extrude plot
#' @param height_col Column name that should be used to inform height of holographic pillars
#' @param session Shiny session; should just say session = session
#'
#' @returns One half of a Shiny-compatible render and output combo. You don't need to assign this to Shiny's output list
#' @export
renderHoloMap = function(outputId = NULL, dat, label_col = NULL, height_col = NULL, session){
  observe({
    if(is.null(outputId)) stop("outputId must be named for renderHoloMap()")
    if(is.null(session)) stop("session must be 'session = session'")
    if(is.reactive(dat)) dat = dat()
    if(is.null(height_col)){
      if('height' %in% names(dat)) {
        height_col = 'height' # Check for obvious labelling
      } else {
        stop("height_col cannot be NULL for renderHoloMap()")
      }
    }
    dat = dat |>
      dplyr::rename(height = !!rlang::sym(height_col))
    # If no reactiveVal exists for this outputId to track first data send, create it.
    if(!exists(paste0('first_data_send_',outputId), envir = session$userData)){
      # Create first_data_send reactive and ship it to global env
      session$userData[[paste0('first_data_send_',outputId)]] <- reactiveVal(FALSE)
      print(paste0("Using reactiveVal first_data_send_",outputId))
    }
    # Send data first time to holoMap.js
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
        data = dat |> dplyr::select(height)
      ))
    }
  })
}
