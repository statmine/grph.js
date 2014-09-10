
#' Generate a color palette for categorical variables using \code{\link{hcl}}
#'
#' @param n size of the palette; number of colors to generate.
#' @param ordered if FALSE the distance between subsequent colors is choosen as
#' large as possible. If true the colors follow the color wheel.
#' @param offset the starting position on the color wheel; the hue. This
#' determines the first color. The default value of 40 generates an orangy
#' color. The value should be between 0 and 360.
#' @param c The chroma of the colors; see \code{\link{hcl}}.
#' @param l The luminance of the colors; see \code{\link{hcl}}.
#' @param alpha The transparency of the colors; see \code{\link{hcl}}. This
#' should be a value between 0 (=tranparent) and 1 (=opaque).
#' @param plot If TRUE a plot is generated showing the palette.
#'
#' @examples
#' hcl_palette(10, plot = TRUE)
#'
#' @export
hcl_palette <- function(n, ordered = FALSE, offset=40,
    c = 150, l = 60, alpha = NULL, plot = FALSE) {
  if (ordered) {
    pal <- seq_len(n) - 1
  } else {
    pal <- 0
    p <- 0
    step <- min(4, n/2)
    for (i in seq_len(n-1)) {
      p <- floor(p + step) %% n
      while (p %in% pal) {
        p <- (p + 1) %% n
      }
      pal <- c(pal, p)
    }
  }
  h <- (pal * 360/n + offset) %% 360
  if (is.null(alpha)) {
    pal <- hcl(h=h, c=c, l=l)
  } else {
    pal <- hcl(h=h, c=c, l=l, alpha = alpha)
  }
  if (plot) {
    plot(0, 0, xlim=c(0,1), ylim=c(0, n), type='n', bty='n', xaxt='n',
    yaxt='n', xlab='', ylab='', xaxs='i', yaxs='i')
    axis(2, at=seq_len(n) - 0.5, labels=1:n, las=2, lwd=0, lwd.ticks=1)
    rect(rep(0, n), seq(0, n-1), rep(1, n), seq(1, n),
    col=pal, border=NA)
    text(0.5, 1:n-0.5, pal)
  }
  pal
}

ncolours <- 10;
alpha <- c(0.3, 0.7, 1)
pal <- hcl_palette(ncolours, ordered=FALSE)

css <- paste0(".colour", 1:ncolours, " {\n  stroke: ", pal, ";\n  stroke-opacity: ", alpha[2], ";\n}\n")
css_low <- paste0(".colour", 1:ncolours, ".colourlow {\n  stroke: ", pal, ";\n  stroke-opacity: ", alpha[1], ";\n}\n")
css_high <- paste0(".colour", 1:ncolours, ".colourhigh {\n  stroke: ", pal, ";\n  stroke-opacity: ", alpha[3], ";\n}\n")
css <- c(css, css_low, css_high)

alpha <- c(0.0, 0.0, 0.0)
css_normal <- paste0("circle.colour", 1:ncolours, " {\n  fill: ", pal, ";\n  fill-opacity: ", alpha[2], ";\n}\n")
css_low <- paste0("circle.colour", 1:ncolours, ".colourlow {\n  fill: ", pal, ";\n  fill-opacity: ", alpha[1], ";\n}\n")
css_high <- paste0("circle.colour", 1:ncolours, ".colourhigh {\n  fill: ", pal, ";\n  fill-opacity: ", alpha[3], ";\n}\n")
css <- c(css, css_normal, css_low, css_high)

writeLines(css, "../css/colours.css")

