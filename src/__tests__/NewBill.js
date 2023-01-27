/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import { ROUTES } from "../constants/routes"
import userEvent from "@testing-library/user-event";

import { localStorageMock } from "../__mocks__/localStorage.js"

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
        document, onNavigate, store: mockStore, localStorage: localStorageMock
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
        document, onNavigate, store: mockStore, localStorage: localStorageMock
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
        document, onNavigate, store: mockStore
        , localStorage: localStorageMock
      })

      const form = screen.getByTestId("form-new-bill")

      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = 'Test New Bill'
      screen.getByTestId("datepicker").value = '050510751'
      screen.getByTestId("amount").value = 45
      screen.getByTestId("vat").value = 20
      screen.getByTestId("pct").value = 20
      screen.getByTestId("commentary").value = 'This is a commentary of new Bill'

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

  // test d'intégration POST
  describe("When I navigate to NewBill", () => {
    let mockedStore
    beforeEach(() => {
      mockedStore = jest.spyOn(mockStore, "bills")
    })
    afterEach(() => {
      // Reset to the original method implementation (non-mocked) and clear all the mock data
      mockedStore.mockRestore();
    });

    test("fetches bills from an API get response", async () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault()
        mockStore
          .bills()
          .create('data')
          .catch(err => err.message)
          .then(resp => {
            expect(resp.key).toBe("1234")
            expect(resp.fileUrl).toBe("https://localhost:3456/images/test.jpg")
          })
      })

      const submitBtn = screen.getByTestId("btn-send-bill")
      submitBtn.addEventListener("click", (e) => handleSubmit(e))

      userEvent.click(submitBtn)
      expect(handleSubmit).toHaveBeenCalled()
    })

    describe("When an error occurs on API", () => {
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })

        const handleSubmit = jest.fn((e) => {
          e.preventDefault()
          mockStore
            .bills()
            .create('data')
            .catch(err => expect(err.message).toBe("Erreur 404"))
        })

        const submitBtn = screen.getByTestId("btn-send-bill")
        submitBtn.addEventListener("click", (e) => handleSubmit(e))

        userEvent.click(submitBtn)
        expect(handleSubmit).toHaveBeenCalled()
        expect(handleSubmit).toThrowError()
      })

      test("fetches bills from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        const handleSubmit = jest.fn((e) => {
          e.preventDefault()
          mockStore
            .bills()
            .create('data')
            .catch(err => expect(err.message).toBe("Erreur 500"))
        })

        const submitBtn = screen.getByTestId("btn-send-bill")
        submitBtn.addEventListener("click", (e) => handleSubmit(e))

        userEvent.click(submitBtn)
        expect(handleSubmit).toHaveBeenCalled()
        expect(handleSubmit).toThrowError()
      })

    })

  })

})
