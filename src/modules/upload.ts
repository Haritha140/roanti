import { appState, emitEvent, showToast } from '../main';

export function initUpload() {
    const dropzone = document.getElementById('upload-dropzone') as HTMLElement;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const browseBtn = document.getElementById('browse-btn') as HTMLButtonElement;
    const preview = document.getElementById('upload-preview') as HTMLElement;
    const previewImg = document.getElementById('preview-image') as HTMLImageElement;
    const uploadInfo = document.getElementById('upload-info') as HTMLElement;
    const uploadError = document.getElementById('upload-error') as HTMLElement;
    const changeBtn = document.getElementById('change-image-btn') as HTMLButtonElement;
    const roomTypeSelector = document.getElementById('room-type-selector') as HTMLElement;
    const heroUploadBtn = document.getElementById('hero-upload-btn') as HTMLButtonElement;
    const heroDemoBtn = document.getElementById('hero-demo-btn') as HTMLButtonElement;

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(event => {
        dropzone.addEventListener(event, (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        dropzone.addEventListener(event, (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
        });
    });

    dropzone.addEventListener('drop', (e: DragEvent) => {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    });

    dropzone.addEventListener('click', () => fileInput.click());
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    changeBtn.addEventListener('click', () => {
        fileInput.click();
    });

    heroUploadBtn.addEventListener('click', () => {
        document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => fileInput.click(), 500);
    });

    heroDemoBtn.addEventListener('click', () => loadDemoImage());

    document.getElementById('hero-explore-btn')?.addEventListener('click', () => {
        document.getElementById('slider-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Room type cards
    document.querySelectorAll('.room-type-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.room-type-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            appState.roomType = card.getAttribute('data-room') || 'living';
            emitEvent('roomTypeChanged', appState.roomType);
            emitEvent('regenerateDesign');
            showToast(`Room type set to ${appState.roomType}`, 'success');
        });
    });

    function handleFile(file: File) {
        const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
        if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
            showError('Invalid file type. Please upload JPG, PNG, HEIC, or WebP.');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            showError('File too large. Maximum size is 20MB.');
            return;
        }

        uploadError.style.display = 'none';

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataURL = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
                appState.uploadedImage = img;
                appState.uploadedImageDataURL = dataURL;

                previewImg.src = dataURL;
                dropzone.style.display = 'none';
                preview.style.display = 'block';
                roomTypeSelector.style.display = 'block';

                uploadInfo.textContent = `${file.name} • ${img.naturalWidth}×${img.naturalHeight} • ${(file.size / 1024).toFixed(1)}KB`;

                emitEvent('imageUploaded', img, dataURL);
                showToast('Room image uploaded successfully!', 'success');
            };
            img.onerror = () => showError('Failed to load the image. Please try another file.');
            img.src = dataURL;
        };
        reader.onerror = () => showError('Failed to read the file. Please try again.');
        reader.readAsDataURL(file);
    }

    function showError(msg: string) {
        uploadError.textContent = msg;
        uploadError.style.display = 'block';
        showToast(msg, 'error');
    }

    function loadDemoImage() {
        // Load a realistic AI-generated room photograph
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // Convert to data URL for consistent handling
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.92);

            appState.uploadedImage = img;
            appState.uploadedImageDataURL = dataURL;

            previewImg.src = dataURL;
            dropzone.style.display = 'none';
            preview.style.display = 'block';
            roomTypeSelector.style.display = 'block';

            uploadInfo.textContent = `Demo Room • ${img.naturalWidth}×${img.naturalHeight} • AI Photo`;
            emitEvent('imageUploaded', img, dataURL);
            showToast('Demo room loaded! Scroll down to see the AI transformation.', 'success');

            document.getElementById('slider-section')?.scrollIntoView({ behavior: 'smooth' });
        };
        img.onerror = () => {
            showToast('Failed to load demo image, please try uploading your own.', 'error');
        };
        img.src = '/demo-room.png';
    }
}
