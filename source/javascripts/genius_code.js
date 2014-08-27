$(function() {
  $('pre').each(function() {
    var $this = $(this)
    if ($this.find('[data-highlight-class]').length) {
      $this.wrap($('<div>', {'class': 'highlight'}).append($('<code>')))
    }
  })
})
