(function (global) {
  'use strict';

  var HEIC_SCRIPT = '/UPA-Final/vendor/heic2any.min.js';
  var CROPPER_SCRIPT = '/UPA-Final/vendor/cropper.min.js';
  var CROPPER_CSS = '/UPA-Final/vendor/cropper.min.css';
  var MAX_IMAGE_EDGE = 2200;
  var JPEG_QUALITY = 0.82;
  var EDITOR_MAX_EDGE = 2000;
  var EDITOR_JPEG_QUALITY = 0.9;
  var EDITOR_RENDER_TIMEOUT_MS = 8000;
  var loadedAssets = {};

  function abortError(message) {
    var error = new Error(message || 'Upload preparation was cancelled');
    error.name = 'AbortError';
    return error;
  }

  function throwIfAborted(signal) {
    if (signal && signal.aborted) throw abortError('Upload preparation was cancelled');
  }

  function extension(file) {
    var name = String(file && file.name || '').toLowerCase();
    return name.indexOf('.') === -1 ? '' : name.slice(name.lastIndexOf('.') + 1);
  }

  function isPdf(file) {
    return !!file && (file.type === 'application/pdf' || extension(file) === 'pdf');
  }

  function isHeic(file) {
    var type = String(file && file.type || '').toLowerCase();
    var ext = extension(file);
    return type === 'image/heic' || type === 'image/heif' || ext === 'heic' || ext === 'heif';
  }

  function isImage(file) {
    var type = String(file && file.type || '').toLowerCase();
    return !!file && (type.indexOf('image/') === 0 || ['jpg', 'jpeg', 'png', 'heic', 'heif'].indexOf(extension(file)) !== -1);
  }

  function isSupported(file) {
    return isPdf(file) || isImage(file);
  }

  function loadScript(src, ready) {
    if (ready()) return Promise.resolve();
    if (loadedAssets[src]) return loadedAssets[src];
    loadedAssets[src] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function () {
        if (ready()) resolve();
        else reject(new Error('Required image library did not initialize'));
      };
      script.onerror = function () {
        reject(new Error('Required image library could not be loaded'));
      };
      document.head.appendChild(script);
    });
    return loadedAssets[src];
  }

  function loadCss(href) {
    if (document.querySelector('link[data-upa-cropper-css]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-upa-cropper-css', 'true');
    document.head.appendChild(link);
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('The prepared image could not be read')); };
      reader.readAsDataURL(blob);
    });
  }

  function makeFile(blob, originalName) {
    var base = String(originalName || 'medical-bill').replace(/\.[^.]+$/, '') || 'medical-bill';
    return new File([blob], base + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  }

  function convertHeic(file, signal, onProgress) {
    if (!isHeic(file)) return Promise.resolve(file);
    onProgress(8, 'Opening your HEIC photo...');
    return loadScript(HEIC_SCRIPT, function () { return typeof global.heic2any === 'function'; })
      .then(function () {
        throwIfAborted(signal);
        onProgress(14, 'Converting your phone photo...');
        return global.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      })
      .then(function (result) {
        throwIfAborted(signal);
        var blob = Array.isArray(result) ? result[0] : result;
        if (!(blob instanceof Blob)) throw new Error('The HEIC photo could not be converted');
        return makeFile(blob, file.name);
      });
  }

  function canvasToFile(canvas, originalName, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error('The image could not be compressed'));
          return;
        }
        resolve(makeFile(blob, originalName));
      }, 'image/jpeg', quality);
    });
  }

  function cropAndCompress(file, signal, onProgress) {
    loadCss(CROPPER_CSS);
    throwIfAborted(signal);
    var modal = document.getElementById('upa-image-editor');
    var image = document.getElementById('upa-image-editor-preview');
    var status = document.getElementById('upa-image-editor-status');
    var rotateLeft = document.getElementById('upa-image-rotate-left');
    var rotateRight = document.getElementById('upa-image-rotate-right');
    var reset = document.getElementById('upa-image-reset');
    var cancel = document.getElementById('upa-image-cancel');
    var useOriginal = document.getElementById('upa-image-use-original');
    var apply = document.getElementById('upa-image-apply');
    if (!modal || !image || !status || !rotateLeft || !rotateRight || !reset || !cancel || !useOriginal || !apply) {
      throw new Error('The image editor is unavailable');
    }

    return new Promise(function (resolve, reject) {
      var objectUrl = URL.createObjectURL(file);
      var cropper;
      var settled = false;
      var previousFocus = document.activeElement;
      var renderTimer;

      function setStatus(message, isError) {
        status.textContent = message || '';
        status.hidden = !message;
        status.classList.toggle('is-error', !!isError);
      }

      function showOriginalFallback(message) {
        if (settled) return;
        setStatus(message || 'The photo editor could not open. You can use the original photo instead.', true);
        useOriginal.hidden = false;
        apply.disabled = true;
        rotateLeft.disabled = true;
        rotateRight.disabled = true;
        reset.disabled = true;
        try { useOriginal.focus(); } catch (error) {}
      }

      function cleanup() {
        window.clearTimeout(renderTimer);
        if (cropper) cropper.destroy();
        URL.revokeObjectURL(objectUrl);
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('upa-image-editor-open');
        rotateLeft.onclick = null;
        rotateRight.onclick = null;
        reset.onclick = null;
        cancel.onclick = null;
        useOriginal.onclick = null;
        apply.onclick = null;
        rotateLeft.disabled = false;
        rotateRight.disabled = false;
        reset.disabled = false;
        apply.disabled = false;
        useOriginal.hidden = true;
        setStatus('', false);
        if (signal) signal.removeEventListener('abort', onAbort);
        if (previousFocus && previousFocus.focus) previousFocus.focus();
      }

      function finishOriginal() {
        if (settled) return;
        settled = true;
        onProgress(22, 'Using the original photo...');
        cleanup();
        resolve(file);
      }

      function finishError(error) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      }

      function onAbort() {
        finishError(abortError('Upload preparation was cancelled'));
      }

      function enableCropper() {
        return loadScript(CROPPER_SCRIPT, function () { return typeof global.Cropper === 'function'; })
          .then(function () {
            throwIfAborted(signal);
            cropper = new global.Cropper(image, {
              viewMode: 1,
              dragMode: 'move',
              autoCropArea: 0.94,
              responsive: true,
              background: false,
              checkOrientation: true,
              rotatable: true,
              scalable: false,
              zoomOnWheel: true,
              toggleDragModeOnDblclick: false,
              ready: function () {
                window.clearTimeout(renderTimer);
                setStatus('', false);
                apply.disabled = false;
                rotateLeft.disabled = false;
                rotateRight.disabled = false;
                reset.disabled = false;
                requestAnimationFrame(function () { apply.focus(); });
              }
            });
            rotateLeft.onclick = function () { if (cropper) cropper.rotate(-90); };
            rotateRight.onclick = function () { if (cropper) cropper.rotate(90); };
            reset.onclick = function () { if (cropper) cropper.reset(); };
            apply.onclick = function () {
              if (settled || !cropper) return;
              apply.disabled = true;
              onProgress(20, 'Compressing your photo...');
              var canvas = cropper.getCroppedCanvas({
                maxWidth: MAX_IMAGE_EDGE,
                maxHeight: MAX_IMAGE_EDGE,
                fillColor: '#ffffff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
              });
              canvasToFile(canvas, file.name, JPEG_QUALITY).then(function (prepared) {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(prepared);
              }).catch(function (error) {
                apply.disabled = false;
                showOriginalFallback(error && error.message ? error.message : 'The cropped photo could not be prepared. You can use the original photo instead.');
              });
            };
          })
          .catch(function (error) {
            showOriginalFallback(error && error.message ? error.message : 'The photo editor could not open. You can use the original photo instead.');
          });
      }

      cancel.onclick = function () { finishError(abortError('Photo editing was cancelled')); };
      useOriginal.onclick = finishOriginal;
      apply.disabled = true;
      rotateLeft.disabled = true;
      rotateRight.disabled = true;
      reset.disabled = true;
      useOriginal.hidden = true;

      image.onload = function () {
        try {
          throwIfAborted(signal);
          setStatus('Loading photo editor...', false);
          enableCropper();
        } catch (error) {
          showOriginalFallback(error && error.message ? error.message : 'The photo editor could not open. You can use the original photo instead.');
        }
      };
      image.onerror = function () {
        showOriginalFallback('The photo preview could not open. You can use the original photo instead.');
      };

      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('upa-image-editor-open');
      setStatus('Opening photo preview...', false);
      renderTimer = window.setTimeout(function () {
        showOriginalFallback('The photo preview is taking too long. You can use the original photo instead.');
      }, EDITOR_RENDER_TIMEOUT_MS);
      image.src = objectUrl;
      onProgress(16, 'Adjust the photo so the full bill is visible.');
    });
  }

  // Downscale oversized camera photos before the editor. Large iPhone photos
  // (12MP standard, up to 48MP on Pro) exceed iOS Safari's image/canvas paint
  // budget and render the crop stage black. Best-effort only: any failure
  // resolves with the original file so existing editor fallbacks still apply.
  function downscaleForEditor(file, signal, onProgress) {
    if (!file || typeof file.type !== 'string' || file.type.indexOf('image/') !== 0) {
      return Promise.resolve(file);
    }
    return new Promise(function (resolve) {
      var objectUrl = URL.createObjectURL(file);
      var image = new Image();
      var done = false;

      function finish(result) {
        if (done) return;
        done = true;
        image.onload = null;
        image.onerror = null;
        URL.revokeObjectURL(objectUrl);
        resolve(result);
      }

      image.onload = function () {
        try {
          if (signal && signal.aborted) { finish(file); return; }
          var width = image.naturalWidth || image.width;
          var height = image.naturalHeight || image.height;
          var longest = Math.max(width, height);
          if (!width || !height || longest <= EDITOR_MAX_EDGE) { finish(file); return; }
          var scale = EDITOR_MAX_EDGE / longest;
          var targetW = Math.max(1, Math.round(width * scale));
          var targetH = Math.max(1, Math.round(height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          var context = canvas.getContext('2d');
          if (!context) { finish(file); return; }
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, targetW, targetH);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(image, 0, 0, targetW, targetH);
          onProgress(12, 'Preparing your photo...');
          canvas.toBlob(function (blob) {
            canvas.width = 1;
            canvas.height = 1;
            finish(blob ? makeFile(blob, file.name) : file);
          }, 'image/jpeg', EDITOR_JPEG_QUALITY);
        } catch (error) {
          finish(file);
        }
      };
      image.onerror = function () { finish(file); };
      image.src = objectUrl;
    });
  }

  function prepareImage(file, options) {
    options = options || {};
    var signal = options.signal;
    var onProgress = typeof options.onProgress === 'function' ? options.onProgress : function () {};
    throwIfAborted(signal);
    return convertHeic(file, signal, onProgress)
      .then(function (converted) {
        throwIfAborted(signal);
        return downscaleForEditor(converted, signal, onProgress);
      })
      .then(function (prepared) {
        throwIfAborted(signal);
        return cropAndCompress(prepared, signal, onProgress);
      });
  }

  function postImages(images, options) {
    options = options || {};
    var signal = options.signal;
    var onProgress = typeof options.onProgress === 'function' ? options.onProgress : function () {};
    throwIfAborted(signal);
    onProgress(66, 'Reading text and billing details from the image...');
    return fetch('/api/extract-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: images }),
      signal: signal
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (result) {
        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.userMessage || result.error || 'The image could not be read');
        }
        return result.data;
      });
    });
  }

  function extractImage(file, options) {
    options = options || {};
    var onProgress = typeof options.onProgress === 'function' ? options.onProgress : function () {};
    throwIfAborted(options.signal);
    onProgress(42, 'Preparing the image for secure review...');
    return blobToDataUrl(file).then(function (dataUrl) {
      throwIfAborted(options.signal);
      return postImages([{ dataUrl: dataUrl, name: file.name || 'medical-bill.jpg' }], options);
    });
  }

  function renderPdfPagesForOcr(pdf, options) {
    options = options || {};
    var signal = options.signal;
    var onProgress = typeof options.onProgress === 'function' ? options.onProgress : function () {};
    var pageLimit = Math.min(Number(pdf && pdf.numPages) || 1, 4);
    var images = [];
    var chain = Promise.resolve();

    function renderPage(pageNumber) {
      return pdf.getPage(pageNumber).then(function (page) {
        throwIfAborted(signal);
        var base = page.getViewport({ scale: 1 });
        var scale = Math.min(2, 1600 / Math.max(base.width, base.height));
        var viewport = page.getViewport({ scale: Math.max(1.2, scale) });
        var canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        var context = canvas.getContext('2d', { alpha: false });
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        return page.render({ canvasContext: context, viewport: viewport }).promise
          .then(function () { return canvasToFile(canvas, 'bill-page-' + pageNumber + '.jpg', 0.72); })
          .then(blobToDataUrl)
          .then(function (dataUrl) {
            images.push({ dataUrl: dataUrl, name: 'bill-page-' + pageNumber + '.jpg' });
            canvas.width = 1;
            canvas.height = 1;
            onProgress(46 + Math.round((pageNumber / pageLimit) * 18), 'Reading scanned PDF page ' + pageNumber + ' of ' + pageLimit + '...');
          });
      });
    }

    for (var pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      (function (currentPage) {
        chain = chain.then(function () { return renderPage(currentPage); });
      })(pageNumber);
    }

    return chain.then(function () {
      throwIfAborted(signal);
      return postImages(images, options);
    });
  }

  global.UPAMobileUpload = {
    isPdf: isPdf,
    isImage: isImage,
    isHeic: isHeic,
    isSupported: isSupported,
    prepareImage: prepareImage,
    extractImage: extractImage,
    renderPdfPagesForOcr: renderPdfPagesForOcr
  };
})(window);
