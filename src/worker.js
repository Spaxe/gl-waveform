/**
 * @module  gl-waveform/src/worker
 *
 * Complete waveform data might be megabytes, recalc waveform in frame is too slow.
 * We have to do it here.
 */

'use strict';

const render = require('./render');


module.exports = (self) => {
	//samples for worker instance
	let samples = [];
	let options = {};
	let amplitudes = [];
	let lastLen = 0;

	self.addEventListener('message', (e) => {
		let {action, data} = e.data;

		if (action === 'update') {
			options = data;
		}
		else if (action === 'push') {
			for (let i = 0; i < data.length; i++) {
				samples.push(data[i]);
			}
		}
		else if (action === 'set') {
			samples = Array.prototype.slice.call(data);
			lastLen = samples.length;
		}
	});

	//60fps we want
	function processData () {
		if (!amplitudes.length || !options.outline) {
			amplitudes = render(samples, options);
		}

		else if (options.outline) {
			let skipped = samples.length - lastLen;
			if (skipped > options.samplesPerPixel) {
				let data = render(samples.slice(-skipped), options);
				for (let i = 0; i < data[0].length; i++) {
					amplitudes[0].push(data[0][i]);
					amplitudes[1].push(data[1][i]);
				}
				amplitudes[0] = amplitudes[0].slice(-options.width);
				amplitudes[1] = amplitudes[1].slice(-options.width);
				lastLen = samples.length;
			}
		}

		postMessage(amplitudes);

		setTimeout(processData, 10);
	}
	processData();
};
