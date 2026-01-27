import { expect, test, describe, it, vi, beforeEach } from 'vitest'
import { useContractManagement } from '../rental-frontend/src/app/hooks/useContractManagement'
import { renderHook, act } from '@testing-library/react'

const mockWriteContractAsync = vi.fn()
vi.mock('wagmi', () => ({
    useAccount: () => ({address: '0x1234567890123456789012345678901234567890'}),
    useReadContract: () => ({ data: [], isLoading: false, error: null}),
    useWriteContract: () => ({ writeContractAsync: mockWriteContractAsync }),
    useWaitForTransactionReceipt: () => ({ isPending: false, isSuccess: false, isError: false}),
}))

vi.mock('@/lib/LeaseFactory.json', () => ({
    default: { abi: [] }
}))

describe("Create contract suite", () => {
    
    beforeEach(()=> {
        vi.clearAllMocks();
    })

    it("should create a new contract", async () => {
        const mockTxHash = '0x12345';
        mockWriteContractAsync.mockResolvedValue(mockTxHash);

        const { result } = renderHook( () => useContractManagement())
        
        await act(async () => {
            const tx = await result.current.createLease()
            expect(tx).toBe(mockTxHash)
        })

        expect(mockWriteContractAsync).toHaveBeenCalledTimes(1);
        expect(mockWriteContractAsync).toBeCalledWith(
            expect.objectContaining({
                functionName: 'createLease',
            }))
})
    })