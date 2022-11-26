const form = document.getElementById('search-form');
const formInput = form.elements['query'];
const photoList = document.getElementById('photos');
const loader = document.getElementById('loader')
const imagePerPage = 5;
let currentPage = 1;
let debounceTimeForTyping;

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle("show-photo", entry.isIntersecting);
  });
}, {
  threshold: 1
});

const lastPhotoObserver = new IntersectionObserver(async entries => {
  const lastPhoto = entries[0];
  if (!lastPhoto.isIntersecting) return
  await loadNewPictures();
  lastPhotoObserver.unobserve(lastPhoto.target);
  lastPhotoObserver.observe(document.querySelector(".photo:last-child"));
}, {});

addEventListener('keyup', () => {
  clearTimeout(debounceTimeForTyping);
  debounceTimeForTyping = setTimeout(async () => {
    resetListOfPictures();
    hideNoImageComponent();
    if (formInput.value) {
      showLoader();
      preparePhotoContainers(imagePerPage);
      const pictures = await (await getPictures(formInput.value, currentPage)).json();
      const pictureContainers = document.querySelectorAll(".photo");
      const picturesUrls = pictures.hits?.map(photo => ({ largeImageURL: photo.largeImageURL, webformatURL: photo.webformatURL }));
      if (picturesUrls.length > 0) {
        Array.prototype.slice.call(photoList.getElementsByTagName('li')).forEach(async (element, index) => {
          if (index < picturesUrls.length) {
            const elementLink = element.getElementsByTagName('a')[0];
            const pictureHeandler = element.getElementsByTagName('img')[0];
            elementLink.href = picturesUrls[index].largeImageURL;
            elementLink.target = '_blank';
            pictureHeandler.src = picturesUrls[index].webformatURL;
            pictureHeandler.setAttribute('data-source', picturesUrls[index].largeImageURL);
            await pictureHeandler.decode().then(() => {
              lastPhotoObserver.observe(document.querySelector(".photo:last-child"));
              elementLink.addEventListener("click", openDialogForImage);
              hideLoader();
            });
          }
        });
        pictureContainers.forEach(container => {
          observer.observe(container)
        });
      } else {
        showNoImageComponent();
        hideLoader();
      }
    }
  }, 500);
});

async function loadNewPictures() {
  currentPage = currentPage + 1;
  showLoader();
  const pictures = await (await getPictures(formInput.value, currentPage)).json();
  const picturesUrls = pictures.hits?.map(photo => ({ largeImageURL: photo.largeImageURL, webformatURL: photo.webformatURL }));

  if (picturesUrls.length > 0) {
    for (let index=0; index<picturesUrls.length; index++) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      const img = document.createElement('img');

      a.href = picturesUrls[index].largeImageURL;
      a.target = '_blank';
      img.src = picturesUrls[index].webformatURL;
      img.setAttribute('data-source', picturesUrls[index].largeImageURL);
      await img.decode().then(() => {
        a.addEventListener("click", openDialogForImage);
        hideLoader();
      });
  
      img.classList.add('photo-image');
      li.classList.add('photo');
  
      a.appendChild(img);
      li.appendChild(a);
      photoList.appendChild(li);
      observer.observe(li);
    }   
  } else {
    hideLoader();
  }
}

async function getPictures(phrase, page) {
  return fetch(`https://pixabay.com/api/?key=31525960-b140d32095c0ed9bc0e71e393&q=${phrase}&image_type=photo&per_page=${imagePerPage}&page=${page}`)
}

function preparePhotoContainers(_imagePerPage) {
  for (let i=0; i<_imagePerPage; i++) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const img = document.createElement('img');

    img.classList.add('photo-image');
    li.classList.add('photo')

    a.appendChild(img);
    li.appendChild(a);
    photoList.appendChild(li);
  }
}

function resetListOfPictures() {
  currentPage = 1;
  photoList.innerHTML = '';
}

function showLoader() {
  loader.classList.add('show');
}

function hideLoader() {
  loader.classList.remove('show');
}

function showNoImageComponent() {
  const noDataComponent = document.createElement('div');
  noDataComponent.classList.add('no-data');
  noDataComponent.innerText = 'No image found :(';
  document.getElementById('noData').appendChild(noDataComponent);
}

function hideNoImageComponent() {
  document.getElementById('noData').innerHTML = '';
}

function abc(e) {
  console.log(e.target);
}

function openDialogForImage(element) {
  element.preventDefault();
  const image = (element.target).cloneNode(true);
  image.src = image.dataset.source;
  basicLightbox.create(image.outerHTML).show();
}