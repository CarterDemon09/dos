/* eslint-disable semi */

/*
General info:
- https://github.com/internetarchive/emularity-engine/blob/main/README.md

Deploy cluster info:
- https://git.archive.org/ia/TechDocs/-/blob/master/ux/ux-b-cluster.md

Stats:
- https://grafana.us.archive.org/d/000000191/icbinmrtg?orgId=1&refresh=5m&var-fqhostname=www123_us_archive_org&from=now-1h&to=now
- https://grafana.us.archive.org/d/000000191/icbinmrtg?orgId=1&refresh=5m&var-fqhostname=www124_us_archive_org&from=now-1h&to=now

URLs to try per jscott 2024:
https://archive.org/details/msdos_Prince_of_Persia_1990 (Does DOSBOX work?)
https://archive.org/details/TotalReplay (Does particularly complicated MAME work?)
https://archive.org/details/1000cc_Turbo_1990_Energize_cr_CSL_h_KTS (Does Amiga Work?)
https://archive.org/details/Preppie_1982_Adventure_International_US (Do popups work?)
https://archive.org/details/16chmp-11 (Does cross-item loading work?)
https://archive.org/details/hypercard_hypercard-lock (Does Mac Plus Work?)
https://archive.org/details/flash_Caramelldansen (Does Ruffle/Flash Work?)
https://archive.org/details/psx_pepsiman (Does huge-ass item loading Work?)
*/

import Cookies from 'https://esm.archive.org/js-cookie'
import AJS from '../archive/archive.js'
import '../ia-item-userlists/ia-item-userlists.js'
import { $ } from '../util/jquery.js'
import cgiarg from '../util/cgiarg.js'
import onclick from '../util/onclick.js'

let emulator // a global, just in this file, so it's available to all functions below

async function main() {
  window.$ = $
  window.jQuery = $

  // If http origin is null (the string 'null'!), assume onion.
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin#null
  const onion = location.origin === 'null' || location.origin?.endsWith('.onion')

  // eslint-disable-next-line no-nested-ternary
  const js_location = cgiarg('devao')
    ? 'https://internetarchive-emularity-config.dev.archive.org' // nomad review app cluster
    : (onion ? '/services/emularity/config'
      : 'https://emularity-config.ux-b.archive.org') // nomad (alt) prod cluster

  // NOTE: this file sets a lot of globals vars into `window.`
  // eg: `window.IALoader`, `window.Module`, `window.MAMELoader` etc.
  await import(`${js_location}/loader.js`)

  $(async () => {
    const keyboard = JSON.parse($('.js-emulation').val())?.keyboard

    if (keyboard) {
      await import('https://esm.archive.org/jquery-ui@1.13.2/dist/jquery-ui.min.js')
      await import(`${js_location}/jsmess_keyboard_v2/jsmess-keyboard.js`)
      await import(`${js_location}/jsmess_keyboard_v2/${keyboard}.js`)
    }

    $('.js-emulation').each((_idx, e) => {
      // eslint-disable-next-line no-use-before-define
      emulate_setup(JSON.parse($(e).val()))
    })
  })
}

function emulate_setup(game) {
  /* global  IALoader */
  $('.container-ia:first').attr('id', 'begPgSpcr')

  // eslint-disable-next-line  no-param-reassign
  game.toString = (() => game.identifier)
  emulator = new IALoader($('#canvas').get(0), game, null)

  // eslint-disable-next-line no-use-before-define
  onclick('.js-emulation-emulate', emulate)

  // eslint-disable-next-line no-use-before-define
  onclick('.js-emulation-mute-click', mute_click)


  AJS.theatre_controls_position()
  $(window).on('resize  orientationchange', () => {
    clearTimeout(AJS.theatre_controls_position_throttler)
    AJS.theatre_controls_position_throttler = setTimeout(AJS.theatre_controls_position, 250)
  })
}


function emulate() {
  // move the virtual keyboard thing and give it a "go away!" button
  $('.ui-keyboard').prepend(`
    <button style="position:relative;top:-5px;right:-8px;" type="button"
            class="close js-emulation-keyboard" aria-hidden="true">
      <span class="iconochive-remove-circle"></span></button>`)
    .appendTo($('#emulate .posrel')).addClass('showing')

  $('#jsmessSS').fadeOut('slow')
  $('#canvasholder').css('visibility', 'visible')

  $('#theatre-ia .iconochive-unmute, #theatre-ia .iconochive-mute').hide()
  if (Cookies.get('unmute')) {
    $('#theatre-ia .iconochive-unmute').show()
    emulator.unmute()
  } else {
    $('#theatre-ia .iconochive-mute').show()
    emulator.mute()
  }


  emulator.start({ hasCustomCSS: true })

  $('.js-emulation-fullscreen').on('click', emulator.requestFullScreen);

  onclick('.js-emulation-keyboard', () => $('.ui-keyboard').removeClass('showing').hide())

  setTimeout(AJS.theatre_controls_position,   100)
  setTimeout(AJS.theatre_controls_position,   500)
  setTimeout(AJS.theatre_controls_position,  3000)
  setTimeout(AJS.theatre_controls_position, 10000)

  return false
}


function mute_click() { // only used in archive.org/details/ theater gutter (un/mute btn)
  const mutedNOW = !Cookies.get('unmute')

  emulator.setMute(!mutedNOW)

  $('#theatre-ia .iconochive-mute, #theatre-ia .iconochive-unmute').toggle()

  if (mutedNOW) {
    // sounds is off.  make it loud
    Cookies.set('unmute', 1, { path: '/details', expires: 30 })
  } else {
    // sounds is on.  mute it!
    Cookies.remove('unmute', { path: '/details' })
  }

  return false
}


// eslint-disable-next-line no-void
void main()
