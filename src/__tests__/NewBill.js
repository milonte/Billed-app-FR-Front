/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import userEvent from "@testing-library/user-event";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {

  beforeEach(() => {
    document.body.innerHTML = NewBillUI()
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: "a@a"
    }))
  })

  afterEach(() => {
    document.body.innerHTML = ""
    window.localStorage.removeItem('user')
  })

  describe("When I am on NewBill Page", () => {
    test("Then New bill form should be displayed", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })

  describe("When I send file", () => {
    test("File with wrong extension should not be updated", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBillContainer = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const file = new File([
        new Blob(["text.txt"], { type: "text/plain" })],
        'facrure.jpg',
        {
          type: "text/plain",
          lastModified: new Date().getTime()
        });

      const fileInput = screen.getByTestId("file")

      const handleChangeFile = jest.fn((e) => newBillContainer.handleChangeFile(e))

      fileInput.addEventListener("change", (e) => handleChangeFile(e))

      fireEvent.change(fileInput, {
        target: {
          files: [file],
        }
      })


      expect(handleChangeFile).toHaveBeenCalled()

      expect(screen.getByTestId("file-error").innerText).toBe("Fichier non valide")
    })

    test("File with good extension should be updated", async () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBillContainer = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const blob = new Blob(["image"], {
        type: 'image/png',
        lastModifiedDate: new Date(),
        name: "image"
      })
      const file = new File([blob], 'image.png', {
        type: 'image/png',
        size: 119599,
        lastModified: new Date(),
        webkitRelativePath: ""
      });

      const fileInput = screen.getByTestId("file")

      const handleChangeFile = jest.fn(newBillContainer.handleChangeFile)

      fileInput.addEventListener("change", (e) => handleChangeFile(e))

      fireEvent.change(fileInput, {
        target: {
          files: [file]
        }
      })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(handleChangeFile).toHaveBeenCalledTimes(1)
      expect(fileInput.files.length).toEqual(1)

      expect(screen.getByTestId("file-error").innerText).toBe("")
    })
  })

  describe("When I submit a new bill with correct values", () => {
    test("New Bill should be send", async () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBillContainer = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const bill = {
        type: 'Transports',
        name: 'Test New Bill',
        date: new Date().getTime(),
        amount: 45,
        vat: 20,
        pct: 20,
        commentary: 'This is a commentary of new Bill'
      }

      const form = screen.getByTestId("form-new-bill")
      screen.getByTestId("expense-type").value = bill.type
      screen.getByTestId("expense-name").value = bill.name
      screen.getByTestId("datepicker").value = bill.date
      screen.getByTestId("amount").value = bill.amount
      screen.getByTestId("vat").value = bill.vat
      screen.getByTestId("pct").value = bill.pct
      screen.getByTestId("commentary").value = bill.commentary

      const fileInput = screen.getByTestId('file')
      const blob = new Blob(["image"], {
        type: 'image/png',
        lastModifiedDate: new Date(),
        name: "image"
      })
      const file = new File([blob], 'image.png', {
        type: 'image/png',
        size: 119599,
        lastModified: new Date(),
        webkitRelativePath: ""
      });

      fireEvent.change(fileInput, {
        target: {
          files: [file]
        }
      })

      const handleSubmit = jest.fn(newBillContainer.handleSubmit);

      const submitBtn = screen.getByTestId("btn-send-bill")
      submitBtn.addEventListener("click", (e) => handleSubmit(e))
      userEvent.click(submitBtn)
      expect(handleSubmit).toHaveBeenCalled()

      //check changes routes
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
    })
  })


})
