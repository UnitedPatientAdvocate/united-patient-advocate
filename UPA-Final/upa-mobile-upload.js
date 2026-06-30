(function (global) {
  'use strict';

  var HEIC_SCRIPT = '/UPA-Final/vendor/heic2any.min.js';
  var CROPPER_SCRIPT = '/UPA-Final/vendor/cropper.min.js';
  var CROPPER_CSS = '/UPA-Final/vendor/cropper.min.css';
  var MAX_IMAGE_EDGE = 2200;
  var JPEG_QUALITY = 0.82;
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
    return loadScript(CROPPER_SCRIPT, function () { return typeof global.Cropper === 'function'; })
      .then(function () {
        throwIfAborted(signal);
        var modal = document.getElementById('upa-image-editor');
        var image = document.getElementById('upa-image-editor-preview');
        var rotateLeft = document.getElementById('upa-image-rotate-left');
        var rotateRight = document.getElementById('upa-image-rotate-right');
        var reset = document.getElementById('upa-image-reset');
        var cancel = document.getElementById('upa-image-cancel');
        var apply = document.getElementById('upa-image-apply');
        if (!modal || !image || !rotateLeft || !rotateRight || !reset || !cancel || !apply) {
          throw new Error('The image editor is unavailable');
        }

        return new Promise(function (resolve, reject) {
          var objectUrl = URL.createObjectURL(file);
          var cropper;
          var settled = false;
          var previousFocus = document.activeElement;

          function cleanup() {
            if (cropper) cropper.destroy();
            URL.revokeObjectURL(objectUrl);
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('upa-image-editor-open');
            rotateLeft.onclick = null;
            rotateRight.onclick = null;
            reset.onclick = null;
            cancel.onclick = null;
            apply.onclick = null;
            if (signal) signal.removeEventListener('abort', onAbort);
            if (previousFocus && previousFocus.focus) previousFocus.focus();
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

          image.onload = function () {
            try {
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
                toggleDragModeOnDblclick: false
              });
              rotateLeft.onclick = function () { cropper.rotate(-90); };
              rotateRight.onclick = function () { cropper.rotate(90); };
              reset.onclick = function () { cropper.reset(); };
              cancel.onclick = function () { finishError(abortError('Photo editing was cancelled')); };
              apply.onclick = function () {
                if (settled) return;
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
                }).catch(finishError).finally(function () {
                  apply.disabled = false;
                });
              };
              requestAnimationFrame(function () { apply.focus(); });
            } catch (error) {
              finishError(error);
            }
          };
          image.onerror = function () {
            finishError(new Error('The selected photo could not be opened'));
          };

          if (signal) signal.addEventListener('abort', onAbort, { once: true });
          modal.hidden = false;
          modal.setAttribute('aria-hidden', 'false');
          document.body.classList.add('upa-image-editor-open');
          image.src = objectUrl;
          onProgress(16, 'Adjust the photo so the full bill is visible.');
        });
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
        return cropAndCompress(converted, signal, onProgress);
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
