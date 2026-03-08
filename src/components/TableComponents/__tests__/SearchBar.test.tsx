import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchBar } from '../SearchBar'

describe('SearchBar', () => {
  it('renders input with placeholder', () => {
    const onChange = vi.fn()
    render(
      <SearchBar value="" onChange={onChange} placeholder="Search..." />
    )

    const input = screen.getByPlaceholderText('Search...')
    expect(input).toBeInTheDocument()
  })

  it('updates value on input change', async () => {
    const onChange = vi.fn()
    render(
      <SearchBar value="" onChange={onChange} placeholder="Search..." debounceMs={50} />
    )

    const input = screen.getByPlaceholderText('Search..') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'test' } })

    expect(input.value).toBe('test')
  })

  it('shows clear button when value is present', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <SearchBar value="" onChange={onChange} placeholder="Search..." />
    )

    let clearButton = screen.queryByLabelText('Clear search')
    expect(clearButton).not.toBeInTheDocument()

    rerender(
      <SearchBar value="test" onChange={onChange} placeholder="Search..." />
    )

    clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeInTheDocument()
  })

  it('clears input on clear button click', () => {
    const onChange = vi.fn()
    render(
      <SearchBar value="test" onChange={onChange} placeholder="Search..." />
    )

    const clearButton = screen.getByLabelText('Clear search')
    fireEvent.click(clearButton)

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('disables input when disabled prop is true', () => {
    const onChange = vi.fn()
    render(
      <SearchBar value="" onChange={onChange} placeholder="Search..." disabled={true} />
    )

    const input = screen.getByPlaceholderText('Search..') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})
