import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    this.allowedExtensions = ['jpg', 'jpeg', 'png']
    this.allowSubmit = false
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    const fileErrorSpan = document.getElementById("file-error")
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const filePath = e.target.value.split(/\\/g)
    const fileName = filePath[filePath.length - 1]
    const formData = new FormData()
    const fileType = file.type.split('/')[0]
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.set("file", file)
    formData.set("email", email)

    if ("image" == fileType) {
      fileErrorSpan.innerText = "";
      if (this.billId) {
        this.store.bills().delete({ selector: this.billId })
      }

      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true
          }
        })
        .then(({ fileUrl, key }) => {
          this.billId = key
          this.fileUrl = fileUrl
          this.fileName = fileName
          this.allowSubmit = true
        }).catch(error => console.error(error))
    } else {
      fileErrorSpan.innerText = "Fichier non valide";
    }
  }
  handleSubmit = e => {
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const fileType = file.type.split('/')[0]
    e.preventDefault()
    if ("image" == fileType) {
      const email = JSON.parse(localStorage.getItem("user")).email
      const bill = {
        email,
        type: this.document.querySelector(`select[data-testid="expense-type"]`).value,
        name: this.document.querySelector(`input[data-testid="expense-name"]`).value,
        amount: parseInt(this.document.querySelector(`input[data-testid="amount"]`).value),
        date: this.document.querySelector(`input[data-testid="datepicker"]`).value,
        vat: this.document.querySelector(`input[data-testid="vat"]`).value,
        pct: parseInt(this.document.querySelector(`input[data-testid="pct"]`).value) || 20,
        commentary: this.document.querySelector(`textarea[data-testid="commentary"]`).value,
        fileUrl: this.fileUrl,
        fileName: this.fileName,
        status: 'pending'
      }
      console.log(bill)
      this.updateBill(bill)
      //this.onNavigate(ROUTES_PATH['Bills'])
    }
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}