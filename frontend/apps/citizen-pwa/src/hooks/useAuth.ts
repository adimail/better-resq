import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@resq/api-client'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const accessToken = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')

  const profile = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: Boolean(accessToken),
    retry: false,
  })

  const logout = useMutation({
    mutationFn: async () => {
      if (refreshToken) await authService.logout(refreshToken)
    },
    onSettled: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      queryClient.removeQueries({ queryKey: ['auth'] })
    },
  })

  return {
    accessToken,
    refreshToken,
    user: profile.data,
    isAuthenticated: Boolean(accessToken),
    isProfileLoading: profile.isLoading,
    profileError: profile.error,
    logout,
  }
}
